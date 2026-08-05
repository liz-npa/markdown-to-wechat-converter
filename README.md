# markdown-to-wechat-converter

[🌐 在线体验](https://lizabethli.github.io/markdown-to-wechat-converter/)

一个把单份 Markdown 文稿整理成**不同平台可直接复制粘贴格式**的小工具。

当前定位不是 schedule / auto-post，而是 **format-first**：
- 你输入一份 Markdown 原稿
- 选择目标平台
- 工具输出适合该平台的格式
- 你自己复制粘贴去发布

---

## 支持的输出渠道

### 1. WeChat
输出微信公众号友好的富文本 HTML：
- 保留主题色、模板、代码高亮、数学公式、Mermaid 图表
- 适合“复制样式”后粘贴到公众号编辑器

### 2. Substack / GitHub (Markdown)
输出适合复制到 Substack 或 GitHub 的 Markdown 文案：
- 英文翻译在前
- `---` 分隔
- 中文原文在后

这条渠道现在默认就是“可复制的 Markdown 输出”，不再强调调度或自动发布。

### 3. LinkedIn
输出适合 LinkedIn 的纯文本文案：
- 英文版在前
- `——` 分隔
- 中文版在后

### 4. X Thread
输出适合 X 的 thread：
- 自动按长度切分
- 自动编号 `1/N`, `2/N`, `3/N`
- 便于逐条复制粘贴

---

## 主要能力

- 支持标准 Markdown
- WeChat 渠道支持模板化排版
- 支持主题色切换与自定义颜色
- 支持数学公式（MathJax）
- 支持 Mermaid 图表
- 支持代码高亮
- 支持通过 OpenRouter 把中文 Markdown 翻译成英文
- 支持多平台 copy/paste-ready 输出

---

## 使用方式

### 本地打开
无需安装依赖，直接打开：

```bash
open index.html
```

或者在浏览器中手动打开 `index.html`。

### 基本流程
1. 在左侧输入 Markdown
2. 选择输出渠道
3. 如有需要，配置翻译（OpenRouter）
4. 查看右侧预览
5. 点击复制按钮，把内容粘贴到目标平台

---

## 翻译配置（OpenRouter）

在页面顶部点击 `⚙️` 可配置：
- OpenRouter API Key
- 模型
- System Prompt

这些信息会保存在浏览器 localStorage。

如果没有配置翻译：
- Substack / GitHub 会直接复用原文
- LinkedIn 会直接输出原文整理版
- X Thread 会直接基于原文切分

---

## 当前前端结构

```text
markdown-to-wechat-converter/
├── index.html
├── README.md
├── assets/
│   └── examples.js
├── js/
│   ├── app.js
│   ├── channel-converter.js     # 平台输出 adapter / formatter registry
│   ├── config.js
│   ├── markdown-converter.js    # WeChat HTML 渲染
│   ├── math-renderer.js
│   ├── template-manager.js
│   ├── translator.js
│   ├── ui-controller.js
│   ├── wechat-styles.js
│   └── templates/
│       ├── wechat-default.js
│       ├── wechat-minimal.js
│       └── wechat-magazine.js
└── styles/
    └── main.css
```

---

## 架构说明

### WeChat 路径
- `markdown-converter.js` 负责把 Markdown 渲染成公众号风格 HTML
- `template-manager.js` + `js/templates/*` 负责模板切换

### 其他平台路径
- `channel-converter.js` 维护统一的 formatter registry
- 每个 channel 都定义自己的：
  - 输出格式
  - 预览模式
  - 复制按钮文案
  - 提醒文案

这样后续新增渠道（比如 Medium、Notion、Slack）时，只需要新增一个 formatter adapter。

---

## 适合继续扩展的方向

- 给 LinkedIn 加 hook / CTA / hashtag 策略
- 给 X Thread 加首条 opening tweet 模板
- 新增 Medium / Notion / Slack formatter
- 增加“只输出英文 / 只输出中文 / bilingual”切换
- 把平台策略抽成更细的 formatter pipeline

---

## 注意事项

- WeChat 复制时建议使用“粘贴并保留格式”
- 浏览器内直连 API Key 仅适合个人本地使用
- 若要减少密钥暴露，可把翻译切到代理模式

---

## License

MIT