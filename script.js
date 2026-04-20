// Markdown编辑器核心功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');
    const toolbarButtons = document.querySelectorAll('.toolbar-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const clearBtn = document.getElementById('clear-btn');
    const sampleBtn = document.getElementById('sample-btn');
    const copyBtn = document.getElementById('copy-btn');
    const exportBtn = document.getElementById('export-btn');
    const exportMenu = document.getElementById('export-menu');
    const exportMd = document.getElementById('export-md');
    const exportHtml = document.getElementById('export-html');
    const wordCount = document.getElementById('word-count');
    const autoSaveStatus = document.getElementById('auto-save-status');
    const highlightLight = document.getElementById('highlight-light');
    const highlightDark = document.getElementById('highlight-dark');
    
    // 示例Markdown内容
    const sampleMarkdown = `# Markdown编辑器示例

## 基本语法

### 标题
使用 # 号可表示 1-6 级标题，例如：# H1, ## H2, ### H3

### 强调
**粗体** 或者 __粗体__
*斜体* 或者 _斜体_
~~删除线~~

### 列表
#### 无序列表
- 项目1
- 项目2
  - 子项目2.1
  - 子项目2.2

#### 有序列表
1. 第一项
2. 第二项
3. 第三项

### 链接和图片
[链接文字](https://www.example.com)
![图片描述](https://via.placeholder.com/150)

### 引用
> 这是一段引用文本
> 
> 引用可以有多行

### 代码
#### 行内代码
这是一段 \`行内代码\` 示例

#### 代码块
\`\`\`javascript
function hello() {
    console.log("Hello, Markdown!");
}
\`\`\`

### 表格
| 表头1 | 表头2 | 表头3 |
| ----- | ----- | ----- |
| 单元格 | 单元格 | 单元格 |
| 单元格 | 单元格 | 单元格 |

### 分隔线
---

## 功能特点

- 实时预览
- 语法高亮
- 深色/浅色主题
- 自动保存
- 导出功能
- 字数统计

开始编辑吧！
`;

    // 初始化marked选项
    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (err) {
                    console.error('Highlight.js error:', err);
                }
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false
    });

    // 渲染Markdown
    function renderMarkdown() {
        const markdown = editor.value;
        const html = marked.parse(markdown);
        preview.innerHTML = html;
        
        // 处理预览区中的链接
        const links = preview.querySelectorAll('a');
        links.forEach(link => {
            if (link.getAttribute('href') && !link.getAttribute('href').startsWith('#')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
        
        // 更新字数统计
        updateWordCount();
    }

    // 更新字数统计
    function updateWordCount() {
        const text = editor.value.trim();
        const count = text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
        wordCount.textContent = `字数: ${count}`;
    }

    // 处理工具栏按钮点击
    function handleToolbarClick(e) {
        const button = e.target.closest('.toolbar-btn');
        if (!button) return;
        
        const command = button.getAttribute('data-command');
        const value = button.getAttribute('data-value');
        
        // 获取选中文本
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selectedText = editor.value.substring(start, end);
        let replacement = '';
        
        // 根据命令处理文本
        switch (command) {
            case 'heading':
                const level = parseInt(value);
                const prefix = '#'.repeat(level) + ' ';
                replacement = addPrefixToLines(selectedText, prefix);
                break;
                
            case 'bold':
                replacement = `**${selectedText || '粗体文本'}**`;
                break;
                
            case 'italic':
                replacement = `*${selectedText || '斜体文本'}*`;
                break;
                
            case 'strikethrough':
                replacement = `~~${selectedText || '删除线文本'}~~`;
                break;
                
            case 'ul':
                replacement = addPrefixToLines(selectedText || '列表项', '- ');
                break;
                
            case 'ol':
                replacement = addNumberedPrefixToLines(selectedText || '列表项');
                break;
                
            case 'quote':
                replacement = addPrefixToLines(selectedText || '引用文本', '> ');
                break;
                
            case 'code':
                if (selectedText.includes('\n')) {
                    replacement = `
\`\`\`javascript
${selectedText}
\`\`\`
`;
                } else {
                    replacement = `\`${selectedText || '代码'}\``;
                }
                break;
                
            case 'link':
                replacement = `[${selectedText || '链接文字'}](https://www.example.com)`;
                break;
                
            case 'image':
                replacement = `![${selectedText || '图片描述'}](https://via.placeholder.com/150)`;
                break;
                
            case 'table':
                replacement = `
| 表头1 | 表头2 | 表头3 |
| ----- | ----- | ----- |
| 单元格 | 单元格 | 单元格 |
| 单元格 | 单元格 | 单元格 |
`;
                break;
                
            case 'hr':
                replacement = '\n---\n';
                break;
                
            default:
                return;
        }
        
        // 插入文本
        insertText(replacement);
        
        // 重新渲染
        renderMarkdown();
        
        // 保存内容
        saveContent();
    }

    // 向行添加前缀
    function addPrefixToLines(text, prefix) {
        if (!text) return prefix.trim();
        
        return text.split('\n').map(line => {
            // 如果行已经有相同前缀，则移除
            if (line.startsWith(prefix)) {
                return line.substring(prefix.length);
            }
            return prefix + line;
        }).join('\n');
    }

    // 向行添加数字前缀
    function addNumberedPrefixToLines(text) {
        if (!text) return '1. ';
        
        return text.split('\n').map((line, index) => {
            // 检查是否已经是数字列表
            const match = line.match(/^(\d+)\.\s+(.*)$/);
            if (match) {
                return `${index + 1}. ${match[2]}`;
            }
            return `${index + 1}. ${line}`;
        }).join('\n');
    }

    // 在光标位置插入文本
    function insertText(text) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const before = editor.value.substring(0, start);
        const after = editor.value.substring(end);
        
        editor.value = before + text + after;
        
        // 设置光标位置
        const newPosition = start + text.length;
        editor.setSelectionRange(newPosition, newPosition);
        editor.focus();
    }

    // 保存内容到localStorage
    function saveContent() {
        localStorage.setItem('markdown-content', editor.value);
        autoSaveStatus.textContent = '已自动保存';
        autoSaveStatus.classList.add('fade-in');
        
        // 3秒后移除动画类
        setTimeout(() => {
            autoSaveStatus.classList.remove('fade-in');
        }, 300);
    }

    // 加载保存的内容
    function loadContent() {
        const savedContent = localStorage.getItem('markdown-content');
        if (savedContent) {
            editor.value = savedContent;
            renderMarkdown();
        } else {
            // 首次使用，加载示例内容
            editor.value = sampleMarkdown;
            renderMarkdown();
        }
    }

    // 切换深色/浅色主题
    function toggleTheme() {
        document.documentElement.classList.toggle('dark');
        
        // 切换代码高亮主题
        if (document.documentElement.classList.contains('dark')) {
            highlightLight.disabled = true;
            highlightDark.disabled = false;
            localStorage.setItem('theme', 'dark');
        } else {
            highlightLight.disabled = false;
            highlightDark.disabled = true;
            localStorage.setItem('theme', 'light');
        }
    }

    // 初始化主题
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            highlightLight.disabled = true;
            highlightDark.disabled = false;
        } else {
            document.documentElement.classList.remove('dark');
            highlightLight.disabled = false;
            highlightDark.disabled = true;
        }
    }

    // 清空编辑器
    function clearEditor() {
        if (confirm('确定要清空编辑器内容吗？')) {
            editor.value = '';
            renderMarkdown();
            saveContent();
        }
    }

    // 加载示例内容
    function loadSample() {
        if (confirm('确定要加载示例内容吗？当前内容将被替换。')) {
            editor.value = sampleMarkdown;
            renderMarkdown();
            saveContent();
        }
    }

    // 复制预览内容
    function copyPreview() {
        const html = preview.innerHTML;
        const tempElement = document.createElement('div');
        tempElement.innerHTML = html;
        
        // 移除可能的脚本标签
        const scripts = tempElement.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        const text = tempElement.textContent || tempElement.innerText || '';
        
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = '已复制!';
            setTimeout(() => {
                copyBtn.innerHTML = '复制';
            }, 2000);
        }).catch(err => {
            console.error('复制失败:', err);
            copyBtn.textContent = '复制失败';
            setTimeout(() => {
                copyBtn.innerHTML = '复制';
            }, 2000);
        });
    }

    // 导出为Markdown文件
    function exportAsMarkdown() {
        const content = editor.value;
        const blob = new Blob([content], { type: 'text/markdown' });
        downloadFile(blob, 'document.md');
    }

    // 导出为HTML文件
    function exportAsHtml() {
        const markdown = editor.value;
        const html = marked.parse(markdown);
        
        // 创建完整的HTML文档
        const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown导出</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        pre {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
        code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 16px;
            margin-left: 0;
            color: #666;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
        }
        img {
            max-width: 100%;
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
        
        const blob = new Blob([fullHtml], { type: 'text/html' });
        downloadFile(blob, 'document.html');
    }

    // 下载文件
    function downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 事件监听器
    editor.addEventListener('input', renderMarkdown);
    editor.addEventListener('input', debounce(saveContent, 1000));
    toolbarButtons.forEach(button => button.addEventListener('click', handleToolbarClick));
    themeToggle.addEventListener('click', toggleTheme);
    clearBtn.addEventListener('click', clearEditor);
    sampleBtn.addEventListener('click', loadSample);
    copyBtn.addEventListener('click', copyPreview);
    
    // 导出按钮和菜单
    exportBtn.addEventListener('click', () => {
        exportMenu.classList.toggle('hidden');
    });
    
    exportMd.addEventListener('click', (e) => {
        e.preventDefault();
        exportAsMarkdown();
        exportMenu.classList.add('hidden');
    });
    
    exportHtml.addEventListener('click', (e) => {
        e.preventDefault();
        exportAsHtml();
        exportMenu.classList.add('hidden');
    });
    
    // 点击其他地方关闭导出菜单
    document.addEventListener('click', (e) => {
        if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
            exportMenu.classList.add('hidden');
        }
    });
    
    // 防止冒泡
    exportMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }

    // 初始化
    initTheme();
    loadContent();
});