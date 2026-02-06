const DEFAULT_URL = 'https://quote.eastmoney.com/q/122.XAU.html';

// Popup 里嵌入第三方页面时，很多站点会因为 iframe/三方 cookie/安全策略导致“页面内实时脚本不跑”。
// 解决思路：网页依然用 iframe 展示；同时在 popup 顶部用官方数据接口每秒拉取，做到数字实时更新。
const IFRAME_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 仅用于刷新 iframe 网页本身
const LIVE_POLL_INTERVAL_MS = 1000; // 每秒拉取一次实时数据

function formatCountdown(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatHms(d) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatSigned(n, decimals = 2) {
  if (n === null) return '--';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}`;
}

function formatPrice(n, decimals = 2) {
  if (n === null) return '--';
  return n.toFixed(decimals);
}

function inferEastmoneySecId(urlString) {
  // 例：https://quote.eastmoney.com/q/122.XAU.html  -> 122.XAU
  try {
    const u = new URL(urlString);
    if (u.hostname !== 'quote.eastmoney.com') return null;
    const m = u.pathname.match(/\/q\/([^/?#]+)\.html$/i);
    if (!m) return null;
    return m[1];
  } catch (_) {
    return null;
  }
}

function getStoredUrl() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['customUrl'], (result) => {
      resolve(result?.customUrl || '');
    });
  });
}

function normalizeUrlMaybe(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed);
    return trimmed;
  } catch (_) {
    return '';
  }
}

async function fetchEastmoneyQuote(secid) {
  const params = new URLSearchParams({
    secid,
    ut: 'fa5fd1943c7b386f172d6893dbfba10b',
    fltt: '2',
    invt: '2',
    fields: [
      'f43', // 最新价
      'f44', // 最高
      'f45', // 最低
      'f46', // 今开
      'f51', // 昨收
      'f57', // 代码
      'f58', // 名称
      'f170', // 涨跌幅
      'f171' // 涨跌额
    ].join(',')
  });

  const url = `https://push2.eastmoney.com/api/qt/stock/get?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  if (!json || !json.data) throw new Error('No data');
  return json.data;
}

function reloadIframe(frame) {
  try {
    if (frame?.contentWindow?.location) {
      frame.contentWindow.location.reload();
      return;
    }
  } catch (_) {
    // ignore
  }
  try {
    // 兜底：重新设置 src 触发 reload
    // eslint-disable-next-line no-self-assign
    frame.src = frame.src;
  } catch (_) {
    // ignore
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const frame = document.getElementById('goldframe');
  const loader = document.getElementById('loader');
  const timerText = document.getElementById('timer-text');

  const liveBar = document.getElementById('live-bar');
  const liveSymbol = document.getElementById('live-symbol');
  const liveName = document.getElementById('live-name');
  const livePrice = document.getElementById('live-price');
  const liveChange = document.getElementById('live-change');
  const livePct = document.getElementById('live-pct');
  const liveTime = document.getElementById('live-time');

  let liveStop = null;
  let nextIframeRefreshAt = Date.now() + IFRAME_REFRESH_INTERVAL_MS;

  function setLoaderVisible(visible) {
    loader.style.display = visible ? 'flex' : 'none';
  }

  function resetIframeRefreshSchedule() {
    nextIframeRefreshAt = Date.now() + IFRAME_REFRESH_INTERVAL_MS;
  }

  function getIframeRefreshRemainingSeconds() {
    const remainingMs = nextIframeRefreshAt - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }

  function setLiveVisible(visible) {
    liveBar.classList.toggle('hidden', !visible);
    liveBar.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function setLiveDirectionClass(direction) {
    liveBar.classList.remove('up', 'down');
    if (direction === 'up') liveBar.classList.add('up');
    if (direction === 'down') liveBar.classList.add('down');
  }

  function setUrl(url) {
    const normalized = normalizeUrlMaybe(url) || DEFAULT_URL;

    resetIframeRefreshSchedule();
    setLoaderVisible(true);
    frame.src = normalized;

    // 切换实时行情模式
    if (liveStop) {
      liveStop();
      liveStop = null;
    }

    const secid = inferEastmoneySecId(normalized);
    if (!secid) {
      setLiveVisible(false);
      return;
    }

    setLiveVisible(true);
    liveSymbol.textContent = secid.split('.').pop() || secid;
    liveName.textContent = '实时行情';
    livePrice.textContent = '--';
    liveChange.textContent = '--';
    livePct.textContent = '--';
    liveTime.textContent = '--';
    setLiveDirectionClass('flat');

    let inFlight = false;
    let failCount = 0;

    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const data = await fetchEastmoneyQuote(secid);

        const name = typeof data.f58 === 'string' ? data.f58 : '';
        const price = toNumber(data.f43);
        const change = toNumber(data.f171);
        const pct = toNumber(data.f170);

        liveName.textContent = name || '实时行情';
        livePrice.textContent = formatPrice(price, 2);
        liveChange.textContent = formatSigned(change, 2);
        livePct.textContent = pct === null ? '--' : `${formatSigned(pct, 2)}%`;
        liveTime.textContent = `更新: ${formatHms(new Date())}`;

        const direction = change === null ? 'flat' : change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
        setLiveDirectionClass(direction);

        failCount = 0;
      } catch (_) {
        failCount++;
        liveTime.textContent = failCount >= 3 ? '实时数据获取失败' : liveTime.textContent;
      } finally {
        inFlight = false;
      }
    };

    // 立刻拉一次，之后每秒更新
    tick();
    const pollTimer = setInterval(tick, LIVE_POLL_INTERVAL_MS);
    liveStop = () => clearInterval(pollTimer);
  }

  // iframe 加载状态
  setLoaderVisible(true);
  frame.addEventListener('load', () => setLoaderVisible(false));
  frame.addEventListener('error', () => {
    const currentUrl = frame.src || DEFAULT_URL;
    chrome.tabs.create({ url: currentUrl });
    window.close();
  });

  // 先用默认 URL，避免空白；再读取用户自定义 URL 覆盖
  setUrl(DEFAULT_URL);
  timerText.textContent = `网页下次刷新: ${formatCountdown(getIframeRefreshRemainingSeconds())}`;
  const stored = await getStoredUrl();
  const storedUrl = normalizeUrlMaybe(stored);
  if (storedUrl && storedUrl !== DEFAULT_URL) {
    setUrl(storedUrl);
    timerText.textContent = `网页下次刷新: ${formatCountdown(getIframeRefreshRemainingSeconds())}`;
  }

  // iframe 刷新倒计时 + 定期 reload（只启动一次，避免叠加定时器）
  setInterval(() => {
    const remainingSeconds = getIframeRefreshRemainingSeconds();
    timerText.textContent =
      remainingSeconds > 0
        ? `网页下次刷新: ${formatCountdown(remainingSeconds)}`
        : '网页正在刷新...';
  }, 1000);

  setInterval(() => {
    resetIframeRefreshSchedule();
    timerText.textContent = '网页正在刷新...';
    reloadIframe(frame);
  }, IFRAME_REFRESH_INTERVAL_MS);
});
