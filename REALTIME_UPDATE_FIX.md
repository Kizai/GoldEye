# 实时更新方案（Popup 环境）🔄

## 背景

东方财富的行情页面在普通浏览器标签页里可以“秒级更新”。但放到 Chrome 扩展的 `popup` 里用 `iframe` 嵌入时，经常会出现：

- 页面能显示，但数字停留在打开瞬间，不再跳动

这通常不是我们的代码问题，而是 **popup + iframe** 组合下，页面内部的实时脚本（轮询/WebSocket/定时器等）可能被限制或行为异常。

## 解决思路

不要依赖网页自身的“实时脚本”，而是在 popup 自己做实时数据更新：

1. **下方仍用 iframe 展示原网页**（完整页面、交互都保留）
2. **顶部新增“实时行情条”**：通过东方财富官方接口 `push2.eastmoney.com` 每 1 秒拉取一次数据并更新数字
3. **iframe 网页本身仍保留定期刷新**（当前为 5 分钟一次），作为页面内容同步的兜底

这样即使 iframe 内的脚本不跑，用户也能看到“秒级变化”的报价。

## 实现要点

### 1) 需要的权限

在 `manifest.json` 里增加：

- `host_permissions`: `https://push2.eastmoney.com/*`（拉取实时数据）
- 保留 `https://quote.eastmoney.com/*`（原网页访问）

### 2) 识别 secid

从 URL 里解析 `secid`（例如 `https://quote.eastmoney.com/q/122.XAU.html` -> `122.XAU`），然后请求：

`https://push2.eastmoney.com/api/qt/stock/get?secid=122.XAU&fields=...`

### 3) 定时器避免叠加

定时器只在 `DOMContentLoaded` 时初始化一次，不放在 `iframe.onload` 里，避免每次 iframe reload 叠加多个 `setInterval` 导致倒计时越跑越快。

## 总结

popup 里“网页不实时”很常见。最终效果以用户体验为准：

- 顶部数字秒级更新（我们控制）
- 页面主体保持原网页（iframe 展示）
- 页面主体定期刷新（可见倒计时）

