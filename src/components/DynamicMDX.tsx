import { useState, useEffect, useRef } from 'react'
import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { components } from './mdx-components'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { PresenterView } from './PresenterView'

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
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [totalSlides, setTotalSlides] = useState(0)
  const [viewMode, setViewMode] = useState<'normal' | 'presenter' | 'presentation'>('normal')
  const containerRef = useRef<HTMLElement>(null)
  const broadcastChannel = useRef<BroadcastChannel | null>(null)

  // Store presentation data in localStorage when loaded
  useEffect(() => {
    if (content && fileName) {
      localStorage.setItem('presentation-data', JSON.stringify({
        content,
        fileName,
        images
      }))
    }
  }, [content, fileName, images])

  // Check URL for mode parameter and auto-open presenter view
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mode = params.get('mode')
    
    if (mode === 'presentation' || mode === 'presenter') {
      setViewMode(mode as 'presentation' | 'presenter')
    } else if (mode === null) {
      // This is the main presentation view - auto-open presenter view
      const presenterUrl = `${window.location.origin}${window.location.pathname}?mode=presenter`
      window.open(presenterUrl, 'presenter', 'width=1400,height=900,left=0,top=0')
      setViewMode('presentation') // Set this window as presentation
    }

    // Listen for close message from presenter view
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CLOSE_PRESENTATION') {
        onBack() // Go back to file picker
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [onBack])

  // Setup broadcast channel
  useEffect(() => {
    broadcastChannel.current = new BroadcastChannel('presentation-sync')
    
    broadcastChannel.current.onmessage = (event) => {
      if (event.data.type === 'SLIDE_CHANGE') {
        goToSlide(event.data.slideIndex)
      }
    }

    return () => {
      broadcastChannel.current?.close()
    }
  }, [])

  // Count total slides
  useEffect(() => {
    if (containerRef.current) {
      const slides = containerRef.current.querySelectorAll('section')
      setTotalSlides(slides.length)
    }
  }, [MDXContent])

  // Track current slide based on scroll position
  useEffect(() => {
    const container = containerRef.current
    if (!container || !MDXContent) return

    const handleScroll = () => {
      // Calculate current slide
      const slides = container.querySelectorAll('section')
      const currentIndex = Array.from(slides).findIndex((slide) => {
        const rect = slide.getBoundingClientRect()
        return rect.top >= 0 && rect.top < window.innerHeight / 2
      })
      
      if (currentIndex !== -1) {
        setCurrentSlideIndex(currentIndex)
      }
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll() // Initial call

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [MDXContent])

  const goToSlide = (index: number) => {
    if (!containerRef.current) return
    
    const slides = containerRef.current.querySelectorAll('section')
    if (slides[index]) {
      slides[index].scrollIntoView({ behavior: 'smooth' })
      setCurrentSlideIndex(index)
    }
  }

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

    container.addEventListener('keydown', handleKeyDown)

    return () => {
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
          <p className="text-neutral-600 dark:text-neutral-400">Lade Präsentation...</p>
        </div>
      </div>
    )
  }

  // Render the main content (hidden in presenter mode)
  const mainContent = (
    <>
      {/* Progress bar - only in presentation mode */}
      {viewMode === 'presentation' && totalSlides > 0 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-800 z-50">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentSlideIndex + 1) / totalSlides) * 100}%` }}
          />
        </div>
      )}

      <main 
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory" 
        tabIndex={0}
        style={{ display: viewMode === 'presenter' ? 'none' : 'block' }}
      >
        <MDXContent components={customComponents} />
      </main>
    </>
  )

    // Show presenter view overlay
  if (viewMode === 'presenter' && MDXContent) {
    return (
      <>
        {mainContent}
        <PresenterView
          currentSlideIndex={currentSlideIndex}
          totalSlides={totalSlides}
          onSlideChange={goToSlide}
          containerRef={containerRef}
          onBack={onBack}
        />
      </>
    )
  }

  return mainContent
}

