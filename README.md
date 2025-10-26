# MDX + React + Vite + KaTeX + Tailwind CSS + TypeScript

A modern setup for writing interactive documentation with MDX, React 19 with React Compiler, Vite, KaTeX for math rendering, Tailwind CSS 4 with Typography plugin, and full TypeScript support.

## Features

- ⚡️ **Vite** - Fast development and build tool
- ⚛️ **React 19** - Latest React with React Compiler for automatic optimization
- 📝 **MDX** - Write JSX in Markdown documents
- 🔢 **KaTeX** - Beautiful math rendering
- 🎨 **Tailwind CSS 4** - Utility-first CSS framework with Typography plugin
- 🎯 **Custom Components** - Callout boxes, code blocks, highlights, and more
- 📘 **TypeScript** - Full type safety and IntelliSense support
- 🎨 **Syntax Highlighting** - Python, JavaScript, and more with react-syntax-highlighter
- 📜 **Scroll Snap** - Smooth vertical scroll snap navigation

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── mdx-components.jsx    # Custom MDX components
│   │   └── mdx-components.css    # Component styles
│   ├── App.jsx                   # Main app component
│   ├── App.css                   # App styles
│   ├── main.jsx                  # Entry point
│   ├── index.css                 # Global styles (includes KaTeX CSS)
│   └── example.mdx               # Example MDX document
├── index.html                    # HTML template
├── vite.config.js               # Vite configuration
└── package.json                 # Dependencies
```

## Custom Components

### Callout

Create callout boxes with different types:

```mdx
<Callout type="info">
This is an info callout
</Callout>

<Callout type="warning">
This is a warning callout
</Callout>

<Callout type="success">
This is a success callout
</Callout>
```

### CodeBlock

Display code with syntax highlighting:

```mdx
<CodeBlock language="javascript" title="example.js">
{`const greeting = "Hello, World!";
console.log(greeting);`}
</CodeBlock>
```

### Highlight

Highlight text with different colors:

```mdx
This is <Highlight color="yellow">highlighted text</Highlight>.
```

## Math with KaTeX

### Inline Math

Write inline math with single dollar signs:

```mdx
The equation $E = mc^2$ is famous.
```

### Block Math

Write block math with double dollar signs:

```mdx
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

## Creating New MDX Files

1. Create a new `.mdx` file in the `src/` directory
2. Import it in your component:

```jsx
import MyDoc from './my-doc.mdx'

function MyComponent() {
  return <MyDoc />
}
```

## Customizing Components

Edit `src/components/mdx-components.jsx` to add or modify custom components. All components exported from this file are available in your MDX documents.

## License

MIT
