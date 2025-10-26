import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import tailwindcss from '@tailwindcss/vite'

// Custom remark plugin to wrap content between --- in Slide components
function remarkSlides() {
  return (tree: any) => {
    const children = tree.children
    const newChildren: any[] = []
    let slideContent: any[] = []
    
    children.forEach((node: any, index: number) => {
      if (node.type === 'thematicBreak') {
        // Found ---, wrap previous content in a Slide
        if (slideContent.length > 0) {
          newChildren.push({
            type: 'mdxJsxFlowElement',
            name: 'Slide',
            attributes: [],
            children: slideContent
          })
          slideContent = []
        }
      } else {
        slideContent.push(node)
      }
    })
    
    // Wrap remaining content
    if (slideContent.length > 0) {
      newChildren.push({
        type: 'mdxJsxFlowElement',
        name: 'Slide',
        attributes: [],
        children: slideContent
      })
    }
    
    tree.children = newChildren
  }
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkMath, remarkSlides],
        rehypePlugins: [rehypeKatex],
      })
    },
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {
            target: '19'
          }]
        ]
      }
    })
  ]
})
