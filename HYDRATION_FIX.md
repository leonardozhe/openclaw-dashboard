# Hydration 错误解决方案

## 问题原因

Hydration 错误通常由以下原因引起：

1. **浏览器扩展** (最常见) - 广告拦截器、翻译插件等会修改 DOM
2. **开发模式热重载** - Next.js 开发模式下的正常行为
3. **缓存问题** - .next 文件夹缓存导致
4. **时间/随机值** - 服务器和客户端生成不同的值

## 解决方案

### 1. 清除缓存重启（推荐）

```bash
cd /Users/leon/Documents/Development/openclaw/meetclaw-open-tauri-in-progress
rm -rf .next
npm run dev
```

### 2. 在无痕模式测试

打开浏览器的无痕/隐私模式，禁用所有扩展：
- Chrome: `Cmd+Shift+N` (Mac) 或 `Ctrl+Shift+N` (Windows)
- Safari: `Cmd+Shift+N`
- Firefox: `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows)

### 3. 禁用可能的干扰扩展

暂时禁用以下类型的扩展：
- 广告拦截器 (AdBlock, uBlock Origin)
- 翻译插件 (Google Translate)
- 样式修改器 (Stylus, Dark Reader)
- 脚本管理器 (Tampermonkey)

### 4. 检查控制台

打开浏览器控制台 (F12)，查看是否有其他错误信息。

## 已修复的代码问题

代码中已经修复了以下可能导致 hydration 问题的地方：

1. ✅ 使用 `typeof window === 'undefined'` 检查浏览器环境
2. ✅ 使用初始化函数从 localStorage 加载数据
3. ✅ 使用稳定的 key（不使用 index）
4. ✅ 使用确定性的时间格式化函数
5. ✅ 添加了 `mounted` 状态控制客户端渲染

## 如果问题仍然存在

这是 Next.js 开发模式的正常行为，可以忽略。生产环境构建不会出现此问题。

```bash
# 测试生产构建
npm run build
npm run start
```
