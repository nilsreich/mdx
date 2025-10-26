import { useState, useEffect, useRef } from 'react'
import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { components } from './mdx-components'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

interface DynamicMDXProps {
  content: string
  fileName: string
  images: Record<string, string>
  onBack: () => void
}

// Custom remark plugin to wrap content between --- in Slide components
function remarkSlides() {
  return (tree: any) => {
    const children = tree.children
    const newChildren: any[] = []
    let slideContent: any[] = []
    
    children.forEach((node: any) => {
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

export function DynamicMDX({ content, fileName, images, onBack }: DynamicMDXProps) {
  const [MDXContent, setMDXContent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLElement>(null)

  // Create custom img and video components that use the media from the ZIP
  const customComponents = {
    ...components,
    img: (props: any) => {
      const { src, alt, ...rest } = props
      // Try to find the image in the images object
      const imageSrc = images[src] || src
      return <img src={imageSrc} alt={alt} {...rest} />
    },
    video: (props: any) => {
      const { src, ...rest } = props
      // Try to find the video in the images object (we use the same object for all media)
      const videoSrc = images[src] || src
      return <video src={videoSrc} controls {...rest} />
    }
  }

  // Focus the container when MDX content is loaded
  useEffect(() => {
    if (MDXContent && containerRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        containerRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [MDXContent])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !MDXContent) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight - container.clientHeight
      const scrollProgress = (scrollTop / scrollHeight) * 100
      setProgress(scrollProgress)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const direction = e.key === 'ArrowLeft' ? -1 : 1
        container.scrollBy({
          top: container.clientHeight * direction,
          behavior: 'smooth'
        })
      }
      
      // ESC to go back
      if (e.key === 'Escape') {
        onBack()
      }
    }

    container.addEventListener('scroll', handleScroll)
    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [onBack, MDXContent])

  useEffect(() => {
    const compileMDX = async () => {
      try {
        setError(null)
        const result = await evaluate(content, {
          ...runtime,
          remarkPlugins: [remarkMath, remarkSlides],
          rehypePlugins: [rehypeKatex],
        })
        setMDXContent(() => result.default)
      } catch (err) {
        console.error('MDX compilation error:', err)
        setError(err instanceof Error ? err.message : 'Failed to compile MDX')
      }
    }

    compileMDX()
  }, [content])

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-red-50 dark:bg-red-950/20">
        <div className="max-w-2xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
            Fehler beim Laden der Präsentation
          </h2>
          <pre className="text-left bg-red-100 dark:bg-red-900/30 p-4 rounded-lg overflow-auto text-sm mb-6">
            {error}
          </pre>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Zurück zur Dateiauswahl
          </button>
        </div>
      </div>
    )
  }

  if (!MDXContent) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Lade Präsentation...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50">
        <div 
          className="h-full bg-blue-600 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="
          fixed top-4 left-4 z-40
          px-4 py-2 
          bg-white/90 dark:bg-slate-800/90 
          hover:bg-white dark:hover:bg-slate-800
          text-slate-700 dark:text-slate-300
          rounded-lg shadow-lg
          backdrop-blur-sm
          transition-all duration-200
          hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      >
        ← Zurück
      </button>

      {/* File Name */}
      <div className="
        fixed top-4 right-4 z-40
        px-4 py-2 
        bg-white/90 dark:bg-slate-800/90
        text-slate-700 dark:text-slate-300
        rounded-lg shadow-lg
        backdrop-blur-sm
        text-sm font-medium
      ">
        📄 {fileName}
      </div>

      <main 
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory" 
        tabIndex={0}
      >
        <MDXContent components={customComponents} />
      </main>
    </>
  )
}
