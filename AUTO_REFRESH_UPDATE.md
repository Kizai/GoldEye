# 自动刷新与倒计时（网页区域）⏱️

## 目标

popup 里 iframe 展示网页时，为了保证页面内容不会长期停留在旧状态，需要一个“可控的刷新机制”：

- **网页区域（iframe）**：定期刷新（当前为 5 分钟一次）
- **倒计时提示**：底部显示距离下次网页刷新还有多久

注意：网页区域刷新不等于报价实时更新。报价的“每秒变化”由顶部实时行情条负责，详见 `REALTIME_UPDATE_FIX.md`。

## 当前策略

1. **倒计时每秒更新**（只更新文本，不触发刷新）
2. **到点刷新 iframe**（reload 一次）
3. **切换 URL 时重置倒计时**（避免换页面后还沿用旧倒计时）

## 实现片段（示意）

```js
const IFRAME_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
let nextIframeRefreshAt = Date.now() + IFRAME_REFRESH_INTERVAL_MS;

function resetIframeRefreshSchedule() {
  nextIframeRefreshAt = Date.now() + IFRAME_REFRESH_INTERVAL_MS;
}

function getRemainingSeconds() {
  return Math.max(0, Math.ceil((nextIframeRefreshAt - Date.now()) / 1000));
}

setInterval(() => {
  timerText.textContent =
    getRemainingSeconds() > 0 ? `网页下次刷新: ...` : '网页正在刷新...';
}, 1000);

setInterval(() => {
  resetIframeRefreshSchedule();
  reloadIframe(frame);
}, IFRAME_REFRESH_INTERVAL_MS);
```

## 为什么不放到 iframe.onload 里？

iframe 每次 reload 都会触发 `onload`。如果在 `onload` 里再 `setInterval`，就会产生“定时器叠加”，导致：

- 倒计时越跑越快
- 刷新频率异常

所以倒计时/刷新定时器只初始化一次，放在 `DOMContentLoaded` 里。

