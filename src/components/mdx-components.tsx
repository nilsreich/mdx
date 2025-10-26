import React, { type ReactNode, type ComponentType, useEffect, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Types
interface CalloutProps {
  children: ReactNode
  type?: 'info' | 'warning' | 'success' | 'error'
}

interface CodeBlockProps {
  children: ReactNode
  language?: string
  title?: string
}

interface HighlightProps {
  children: ReactNode
  color?: 'yellow' | 'blue' | 'green' | 'pink' | 'purple'
}

interface SlideProps {
  children: ReactNode
  className?: string
  slideIndex?: number
}

// Slide Component for presentation-style sections
export const Slide = ({ children, className = '', slideIndex }: SlideProps) => {
  return (
    <section className={`min-h-screen snap-start snap-always flex items-center ${className}`}>
      <div className="prose prose-slate lg:prose-xl max-w-5xl mx-auto px-8 py-12 dark:prose-invert w-full">
        {children}
      </div>
    </section>
  )
}

// Callout Component
export const Callout = ({ children, type = 'info' }: CalloutProps) => {
  const typeStyles: Record<CalloutProps['type'] & string, string> = {
    info: 'border-l-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
    warning: 'border-l-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    success: 'border-l-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
    error: 'border-l-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
  }

  return (
    <div className={`px-6 py-4 my-6 rounded-lg border-l-4 ${typeStyles[type] || typeStyles.info}`}>
      {children}
    </div>
  )
}

// Code Block Component
export const CodeBlock = ({ children, language = 'javascript', title }: CodeBlockProps) => {
  const code = typeof children === 'string' ? children : String(children)
  const [isDark, setIsDark] = useState(true)
  
  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(isDarkMode)
    }
    
    checkDarkMode()
    
    // Watch for changes in dark mode
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    // Also listen to system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => checkDarkMode()
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])
  
  return (
    <div className={`my-6 rounded-lg overflow-hidden shadow-lg min-w-[800px] ${isDark ? 'bg-slate-900' : 'bg-gray-100'}`}>
      {title && (
        <div className={`px-4 py-3 text-sm font-semibold border-b ${
          isDark 
            ? 'bg-slate-950 text-slate-400 border-slate-700' 
            : 'bg-gray-200 text-gray-700 border-gray-300'
        }`}>
          {title}
        </div>
      )}
      <SyntaxHighlighter
        language={language}
        style={isDark ? vscDarkPlus : vs}
        customStyle={{
          margin: 0,
          padding: '1.5rem',
          background: isDark ? '#0f172a' : '#f8f9fa',
          fontSize: '0.875rem',
          lineHeight: '1.6',
        }}
        showLineNumbers={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

// Highlight Component
export const Highlight = ({ children, color = 'yellow' }: HighlightProps) => {
  const colorStyles: Record<HighlightProps['color'] & string, string> = {
    yellow: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
    blue: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
    green: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100',
    pink: 'bg-pink-100 text-pink-900 dark:bg-pink-900 dark:text-pink-100',
    purple: 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100',
  }

  return (
    <span className={`px-1 py-0.5 rounded font-medium ${colorStyles[color] || colorStyles.yellow}`}>
      {children}
    </span>
  )
}

// Custom heading components with anchor links
const createHeading = (level: 1 | 2 | 3 | 4 | 5 | 6): ComponentType<{ children?: ReactNode }> => {
  const Heading = ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => {
    const id = typeof children === 'string' 
      ? children.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      : undefined
    
    return React.createElement(
      `h${level}`,
      { id, ...props },
      children
    )
  }
  Heading.displayName = `Heading${level}`
  return Heading
}

// Export all custom components
export const components = {
  // Custom components
  Slide,
  Callout,
  CodeBlock,
  Highlight,
  
  // Custom heading components
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  
  // You can override default HTML elements here
  // For example, custom paragraph or link styling
  // p: (props) => <p className="custom-paragraph" {...props} />,
  // a: (props) => <a className="custom-link" {...props} />,
}
