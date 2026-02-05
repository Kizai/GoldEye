# 自定义URL功能更新 🎯

## 新功能：自定义URL设置

GoldEye v1.1 现在支持**自定义URL**功能！你可以设置任何你想查看的金融行情页面。

## ✨ 功能特性

### 1. 右键菜单设置

- **右键点击**插件图标
- 选择 **"⚙️ 设置自定义URL"**
- 打开设置页面

### 2. 精美的设置页面

- 🎨 渐变紫色背景
- 📝 URL输入框
- 🔖 快速选择预设URL
- 💾 保存/恢复按钮
- ✅ 实时状态反馈

### 3. 预设URL快速选择

内置常用行情页面：

- **黄金 (XAU)** - 默认
- **白银 (XAG)**
- **期货行情**
- **外汇行情**

### 4. 数据持久化

- 设置自动保存到 Chrome Storage
- 跨设备同步（如果登录了Chrome账号）
- 下次打开插件自动加载您的设置

## 🎯 使用方法

### 方式一：右键菜单（推荐）

1. **右键点击**浏览器工具栏的GoldEye图标
2. 选择 **"⚙️ 设置自定义URL"**
3. 在设置页面输入URL或选择预设
4. 点击 **"💾 保存设置"**
5. 点击插件图标查看新页面

### 方式二：扩展管理页面

1. 访问 `chrome://extensions/`
2. 找到 GoldEye 插件
3. 点击 **"详细信息"**
4. 点击 **"扩展程序选项"**
5. 进入设置页面

## 📝 支持的URL示例

### 东方财富网

```
黄金: https://quote.eastmoney.com/q/122.XAU.html
白银: https://quote.eastmoney.com/q/122.XAG.html
原油: https://quote.eastmoney.com/q/122.OIL.html
期货: https://quote.eastmoney.com/center/gridlist.html#futures_cffex
外汇: https://quote.eastmoney.com/center/gridlist.html#forex_fx
```

### 其他金融网站

理论上支持任何允许iframe嵌入的网站！

## 🔧 技术实现

### 新增文件

#### `options/options.html`

设置页面UI，包含：

- URL输入框
- 预设按钮
- 保存/重置按钮

#### `options/options.css`

现代化样式设计：

- 渐变背景
- 卡片式布局
- 金色主题配色

#### `options/options.js`

功能逻辑：

- Chrome Storage读写
- URL格式验证
- 状态消息提示

#### `background/background.js`

后台服务：

- 创建右键菜单
- 打开设置页面

### 修改的文件

#### `manifest.json`

- 版本升级到 **1.1**
- 新增权限：`storage`, `contextMenus`
- 添加 `options_page` 配置
- 添加 `background` service worker

#### `popup/popup.js`

- 从 Chrome Storage 加载自定义URL
- 动态设置 iframe src
- 使用自定义URL进行错误fallback

#### `popup/popup.html`

- 移除硬编码的 `src` 属性
- 让JavaScript动态设置

## 📊 版本变更

### v1.1 新增

✅ 自定义URL设置页面  
✅ 右键菜单快捷入口  
✅ 预设URL快速选择  
✅ Chrome Storage 数据持久化  
✅ 跨设备同步支持

### v1.0 基础功能

✅ 实时金价展示  
✅ 60秒自动刷新  
✅ 可视化倒计时  
✅ iframe嵌入容错

## 🚀 测试步骤

1. **重新加载插件**

   ```
   chrome://extensions/ → 找到GoldEye → 点击🔄刷新
   ```

2. **测试右键菜单**
   - 右键点击插件图标
   - 确认看到"⚙️ 设置自定义URL"选项

3. **测试设置页面**
   - 点击右键菜单打开设置
   - 尝试输入自定义URL
   - 点击预设按钮
   - 点击保存按钮
   - 查看成功提示

4. **测试URL应用**
   - 保存设置后关闭设置页
   - 点击插件图标
   - 确认显示的是新设置的页面

5. **测试数据持久化**
   - 关闭Chrome并重新打开
   - 点击插件图标
   - 确认仍然显示自定义的页面

## 💡 小贴士

- **URL格式**：必须包含完整协议（http:// 或 https://）
- **iframe限制**：某些网站禁止被嵌入，会自动在新标签页打开
- **同步功能**：登录Chrome账号可跨设备同步设置
- **恢复默认**：点击"🔄 恢复默认"按钮恢复黄金页面

## 🎉 总结

GoldEye 现在是一个**可定制的金融行情小窗工具**！

- 🔧 完全自定义
- ⚡ 快速切换
- 🎨 精美界面
- 📱 跨设备同步

不只是看黄金，任何行情都能一键查看！✨
