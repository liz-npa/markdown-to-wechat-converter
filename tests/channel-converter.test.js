const test = require('node:test');
const assert = require('node:assert/strict');

global.Translator = {
    translateMarkdownToEnglish: async (markdown) => markdown
};
global.MarkdownConverter = {
    convertMarkdownToWechat: async (markdown) => markdown
};
global.marked = (markdown) => markdown;

const ChannelConverter = require('../js/channel-converter.js');

test('passthrough translation does not duplicate bilingual Markdown', async () => {
    const source = '# 标题\n\n这是原文。';

    assert.equal(await ChannelConverter.buildBilingualMarkdown(source), source);
});

test('passthrough translation does not duplicate a LinkedIn post', async () => {
    const source = '# 标题\n\n这是原文。';

    assert.equal(await ChannelConverter.buildLinkedInPost(source), '标题\n\n这是原文。');
});

test('distinct translation keeps both translated and original content', async () => {
    global.Translator.translateMarkdownToEnglish = async () => '# Title\n\nEnglish body.';
    const source = '# 标题\n\n中文正文。';

    assert.equal(
        await ChannelConverter.buildBilingualMarkdown(source),
        '# Title\n\nEnglish body.\n\n---\n\n# 标题\n\n中文正文。'
    );
    assert.equal(
        await ChannelConverter.buildLinkedInPost(source),
        'Title\n\nEnglish body.\n\n——\n\n标题\n\n中文正文。'
    );
});

test('empty source produces empty channel output', async () => {
    global.Translator.translateMarkdownToEnglish = async (markdown) => markdown;

    assert.equal(await ChannelConverter.buildBilingualMarkdown(''), '');
    assert.equal(await ChannelConverter.buildLinkedInPost('  \n'), '');
    assert.equal(await ChannelConverter.buildXThread(''), '');
    assert.deepEqual(ChannelConverter.splitIntoXThread(''), []);
});

test('X thread splitting preserves complete Unicode characters', () => {
    const text = `${'a'.repeat(259)}😀b`;
    const posts = ChannelConverter.splitIntoXThread(text);

    assert.equal(posts.join(''), text);
    assert.ok(posts.every((post) => post.length <= 260));
    assert.ok(posts.every((post) => !/[\uD800-\uDBFF]$/.test(post)));
    assert.ok(posts.every((post) => !/^[\uDC00-\uDFFF]/.test(post)));
});

test('numbered X posts remain within the 280-character limit', () => {
    const text = Array.from(
        { length: 10 },
        (_, index) => `paragraph-${index}-${'x'.repeat(245)}`
    ).join('\n\n');
    const posts = ChannelConverter.splitIntoXThread(text);
    const numberedPosts = posts.map((post, index) => `${index + 1}/${posts.length}\n${post}`);

    assert.ok(numberedPosts.every((post) => post.length <= 280));
});
