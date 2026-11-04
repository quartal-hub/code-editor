import type { QEditorExample } from "./QEditorExample";

/**
 * Examples for the Markdown editors.
 * @param type The editor type: "markdown" (WYSIWYG) or "markdown-hybrid".
 */
export function getMarkdownExamples(type: "markdown" | "markdown-hybrid"): QEditorExample[] {
  return [
    {
      title: "Formatting and lists",
      descr: "Headings, inline formatting, lists and task lists.",
      mode: "event",
      props: {
        type,
        readOnly: false,
        lang: "markdown",
        code: `# Hello Markdown

Write **bold**, *italic*, ~~strikethrough~~ and \`inline code\`.

## Lists

- A bullet
- Another bullet
  - Nested

1. First
2. Second

- [x] Done task
- [ ] Open task

> Blockquotes work too.

[Link](https://quartal.com)
`,
      },
    },
    {
      title: "Table and code",
      descr: "A GFM table and a fenced code block.",
      mode: "event",
      props: {
        type,
        readOnly: false,
        lang: "markdown",
        code: `# Table and code

| Name | Value  |
| ---- | ------ |
| VAT  | 25.5 % |
| Net  | 100 €  |

\`\`\`ts
export function add(a: number, b: number): number {
  return a + b;
}
\`\`\`
`,
      },
    },
    {
      title: "Read-only",
      descr: "The same editor in read-only mode.",
      mode: "event",
      props: {
        type,
        readOnly: true,
        lang: "markdown",
        code: "# Read-only\n\nThis document **cannot** be edited.\n",
      },
    },
  ];
}
