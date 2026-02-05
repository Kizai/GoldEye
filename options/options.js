// 默认URL
const DEFAULT_URL = 'https://quote.eastmoney.com/q/122.XAU.html';

// DOM 元素
const customUrlInput = document.getElementById('custom-url');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const statusDiv = document.getElementById('status');
const presetBtns = document.querySelectorAll('.preset-btn');

// 加载已保存的设置
function loadSettings() {
  chrome.storage.sync.get(['customUrl'], function(result) {
    customUrlInput.value = result.customUrl || DEFAULT_URL;
  });
}

// 保存设置
function saveSettings() {
  const url = customUrlInput.value.trim();
  
  // 验证URL格式
  if (!url) {
    showStatus('请输入URL', 'error');
    return;
  }
  
  try {
    new URL(url); // 验证URL格式
  } catch (e) {
    showStatus('URL格式不正确', 'error');
    return;
  }
  
  // 保存到 Chrome Storage
  chrome.storage.sync.set({ customUrl: url }, function() {
    showStatus('✅ 设置已保存！', 'success');
    
    // 3秒后清除状态提示
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  });
}

// 恢复默认设置
function resetSettings() {
  customUrlInput.value = DEFAULT_URL;
  chrome.storage.sync.set({ customUrl: DEFAULT_URL }, function() {
    showStatus('✅ 已恢复默认设置', 'success');
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  });
}

// 显示状态消息
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

// 快速选择预设URL
presetBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    const url = this.getAttribute('data-url');
    customUrlInput.value = url;
    
    // 高亮选中的按钮
    presetBtns.forEach(b => b.style.borderColor = '#e0e0e0');
    this.style.borderColor = '#d4af37';
  });
});

// 事件监听
saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetSettings);

// 支持回车键保存
customUrlInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    saveSettings();
  }
});

// 页面加载时读取设置
document.addEventListener('DOMContentLoaded', loadSettings);
