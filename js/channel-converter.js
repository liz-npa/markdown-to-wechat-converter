// Channel-specific output adapters focused on copy/paste-ready formats.
const stripLeadMarkers = (text) =>
    text.replace(/(^|\n)[ \t]*\[\s*lead\s*\][ \t]*/gi, '$1');

const ChannelConverter = {
    channels: {
        wechat: {
            id: 'wechat',
            name: 'WeChat',
            outputLabel: 'HTML代码',
            outputTitle: '📋 HTML 代码 (可滚动查看)',
            copyPreviewLabel: '复制样式',
            copyOutputLabel: '复制代码',
            previewHostClass: 'wechat-preview',
            reminder: null,
            render: async function(markdown, context = {}) {
                const themeColor = context.themeColor;
                const mode = context.mode || 'compact';
                const html = await MarkdownConverter.convertMarkdownToWechat(markdown, mode, themeColor);
                return {
                    output: html,
                    previewHtml: html,
                    previewMode: 'wechat',
                    needsMathTypeset: false
                };
            }
        },
        substack: {
            id: 'substack',
            name: 'Substack / GitHub (Markdown)',
            outputLabel: 'Markdown',
            outputTitle: '📋 Markdown 文案 (可滚动查看)',
            copyPreviewLabel: '复制文案',
            copyOutputLabel: '复制文案',
            previewHostClass: 'markdown-preview',
            reminder: {
                requiresTranslation: true,
                text: '当前渠道建议配置 OpenRouter API Key + System Prompt。未配置时会直接复用原文。'
            },
            render: async function(markdown) {
                const output = await ChannelConverter.buildBilingualMarkdown(markdown);
                return {
                    output,
                    previewHtml: marked(output),
                    previewMode: 'markdown',
                    needsMathTypeset: true
                };
            }
        },
        linkedin: {
            id: 'linkedin',
            name: 'LinkedIn',
            outputLabel: 'Copy',
            outputTitle: '📋 LinkedIn 文案 (可滚动查看)',
            copyPreviewLabel: '复制文案',
            copyOutputLabel: '复制文案',
            previewHostClass: 'plain-text-preview-host',
            reminder: {
                requiresTranslation: true,
                text: '当前渠道建议配置 OpenRouter API Key + System Prompt。未配置时会直接复用原文。'
            },
            render: async function(markdown) {
                const output = await ChannelConverter.buildLinkedInPost(markdown);
                return {
                    output,
                    previewHtml: ChannelConverter.renderPlainTextPreview(output, 'linkedin'),
                    previewMode: 'plain',
                    needsMathTypeset: false
                };
            }
        },
        x: {
            id: 'x',
            name: 'X Thread',
            outputLabel: 'Thread',
            outputTitle: '📋 X Thread 文案 (可滚动查看)',
            copyPreviewLabel: '复制 Thread',
            copyOutputLabel: '复制 Thread',
            previewHostClass: 'thread-preview-host',
            reminder: {
                requiresTranslation: true,
                text: 'X 渠道会自动切成 thread，并在每条前面加 1/N 编号；未配置翻译时会直接基于原文切分。'
            },
            render: async function(markdown) {
                const output = await ChannelConverter.buildXThread(markdown);
                return {
                    output,
                    previewHtml: ChannelConverter.renderXThreadPreview(output),
                    previewMode: 'thread',
                    needsMathTypeset: false
                };
            }
        }
    },

    getChannel(channelId) {
        return this.channels[channelId] || this.channels.wechat;
    },

    listChannels() {
        return Object.values(this.channels).map(({ id, name }) => ({ id, name }));
    },

    async renderForChannel(channelId, markdown, context = {}) {
        const channel = this.getChannel(channelId);
        const result = await channel.render(markdown || '', context);
        return {
            channel,
            output: result.output || '',
            previewHtml: result.previewHtml || '',
            previewMode: result.previewMode || 'plain',
            needsMathTypeset: !!result.needsMathTypeset
        };
    },

    async buildBilingualMarkdown(markdown) {
        const sanitized = this.prepareSourceMarkdown(markdown);
        const enMd = await Translator.translateMarkdownToEnglish(sanitized);
        return `${stripLeadMarkers(enMd)}\n\n---\n\n${sanitized}`.trim();
    },

    async buildLinkedInPost(markdown) {
        const sanitized = this.prepareSourceMarkdown(markdown);
        const enMd = await Translator.translateMarkdownToEnglish(sanitized);
        const enText = this.markdownToPlainText(enMd);
        const zhText = this.markdownToPlainText(sanitized);

        return [enText, '——', zhText].filter(Boolean).join('\n\n').trim();
    },

    async buildXThread(markdown) {
        const sanitized = this.prepareSourceMarkdown(markdown);
        const enMd = await Translator.translateMarkdownToEnglish(sanitized);
        const enText = this.markdownToPlainText(enMd);
        const posts = this.splitIntoXThread(enText);
        return posts.map((post, index) => `${index + 1}/${posts.length}\n${post}`).join('\n\n---\n\n');
    },

    prepareSourceMarkdown(markdown) {
        return stripLeadMarkers(markdown || '');
    },

    markdownToPlainText(markdown) {
        let text = String(markdown || '');

        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) => {
            const languageLabel = lang ? `${lang.toUpperCase()}\n` : '';
            return `\n${languageLabel}${code.trim()}\n`;
        });

        text = text.replace(/`([^`]+)`/g, '$1');
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => alt ? `${alt} (${url})` : url);
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
        text = text.replace(/^\s{0,3}#{1,6}\s+/gm, '');
        text = text.replace(/^\s{0,3}>\s?/gm, '');
        text = text.replace(/^\s*[-*+]\s+/gm, '• ');
        text = text.replace(/^\s*\d+\.\s+/gm, '• ');
        text = text.replace(/\*\*(.*?)\*\*/g, '$1');
        text = text.replace(/__(.*?)__/g, '$1');
        text = text.replace(/\*(.*?)\*/g, '$1');
        text = text.replace(/_(.*?)_/g, '$1');
        text = text.replace(/^\|/gm, '');
        text = text.replace(/\|$/gm, '');
        text = text.replace(/\|/g, ' | ');
        text = text.replace(/^\s*[-: ]{3,}\s*$/gm, '');
        text = text.replace(/\n{3,}/g, '\n\n');

        return text
            .split('\n')
            .map(line => line.replace(/[ \t]+$/g, ''))
            .join('\n')
            .trim();
    },

    splitIntoXThread(text, maxLength = 260) {
        const normalized = String(text || '')
            .replace(/\r/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        if (!normalized) {
            return [''];
        }

        const paragraphs = normalized.split(/\n\n+/).map(part => part.trim()).filter(Boolean);
        const posts = [];
        let current = '';

        const pushCurrent = () => {
            if (current.trim()) {
                posts.push(current.trim());
                current = '';
            }
        };

        const appendChunk = (chunk) => {
            if (!chunk) return;
            if (!current) {
                current = chunk;
                return;
            }
            const candidate = `${current}\n\n${chunk}`;
            if (candidate.length <= maxLength) {
                current = candidate;
                return;
            }
            pushCurrent();
            current = chunk;
        };

        const splitLongParagraph = (paragraph) => {
            const words = paragraph.split(/\s+/).filter(Boolean);
            const chunks = [];
            let buffer = '';

            words.forEach(word => {
                if (!buffer) {
                    if (word.length <= maxLength) {
                        buffer = word;
                    } else {
                        for (let i = 0; i < word.length; i += maxLength) {
                            chunks.push(word.slice(i, i + maxLength));
                        }
                    }
                    return;
                }

                const candidate = `${buffer} ${word}`;
                if (candidate.length <= maxLength) {
                    buffer = candidate;
                } else {
                    chunks.push(buffer);
                    if (word.length <= maxLength) {
                        buffer = word;
                    } else {
                        for (let i = 0; i < word.length; i += maxLength) {
                            chunks.push(word.slice(i, i + maxLength));
                        }
                        buffer = '';
                    }
                }
            });

            if (buffer) {
                chunks.push(buffer);
            }
            return chunks;
        };

        paragraphs.forEach(paragraph => {
            if (paragraph.length <= maxLength) {
                appendChunk(paragraph);
                return;
            }
            pushCurrent();
            splitLongParagraph(paragraph).forEach(chunk => appendChunk(chunk));
        });

        pushCurrent();
        return posts.length ? posts : [''];
    },

    escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    renderPlainTextPreview(text, variant = 'plain') {
        const escaped = this.escapeHtml(text).replace(/\n/g, '<br>');
        return `<div class="plain-text-preview ${variant}-preview">${escaped}</div>`;
    },

    renderXThreadPreview(threadText) {
        const posts = String(threadText || '')
            .split(/\n\n---\n\n/)
            .map(item => item.trim())
            .filter(Boolean);

        const cards = posts.map((post) => {
            const [header, ...bodyLines] = post.split('\n');
            const body = this.escapeHtml(bodyLines.join('\n')).replace(/\n/g, '<br>');
            return `
<div class="thread-card">
  <div class="thread-card-header">${this.escapeHtml(header)}</div>
  <div class="thread-card-body">${body}</div>
</div>`;
        }).join('');

        return `<div class="thread-preview">${cards}</div>`;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChannelConverter;
}
if (typeof window !== 'undefined') {
    window.ChannelConverter = ChannelConverter;
}
