// 默认URL
const DEFAULT_URL = 'https://quote.eastmoney.com/q/122.XAU.html';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5分钟刷新一次

window.onload = function() {
  const frame = document.getElementById('goldframe');
  const timerText = document.getElementById('timer-text');
  let countdown = 300; // 5分钟 = 300秒

  // 先设置默认URL，避免iframe空白
  frame.src = DEFAULT_URL;
  
  // 从存储加载自定义URL（如果有）
  chrome.storage.sync.get(['customUrl'], function(result) {
    if (result.customUrl && result.customUrl !== DEFAULT_URL) {
      // 如果有自定义URL且不同于当前URL，才重新加载
      frame.src = result.customUrl;
    }
  });

  // 检测是否限制嵌入
  frame.onerror = function() {
    const currentUrl = frame.src || DEFAULT_URL;
    chrome.tabs.create({ url: currentUrl });
    window.close();
  };

  // 格式化时间显示
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // 更新倒计时显示
  function updateTimer() {
    if (countdown > 0) {
      timerText.textContent = `下次刷新: ${formatTime(countdown)}`;
      countdown--;
    } else {
      timerText.textContent = '正在刷新...';
    }
  }

  // 页面加载完成后开始倒计时
  frame.onload = function() {
    countdown = 300; // 重置为5分钟
    updateTimer();
    setInterval(updateTimer, 1000); // 每秒更新显示
  };

  // 每5分钟刷新一次iframe
  setInterval(function() {
    countdown = 300;
    timerText.textContent = '正在刷新...';
    frame.contentWindow.location.reload();
  }, REFRESH_INTERVAL);
};
