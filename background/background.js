// 右键菜单 - 打开设置
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'openSettings',
    title: '⚙️ 设置自定义URL',
    contexts: ['action']
  });
});

// 点击右键菜单时打开设置页面
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openSettings') {
    chrome.runtime.openOptionsPage();
  }
});
