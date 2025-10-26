import PresentationDoc from './presentation.mdx'
import { components } from './components/mdx-components'
import './App.css'
import { useEffect, useRef, useState } from 'react'

function App() {
  const containerRef = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Focus the container on mount so keyboard navigation works
    containerRef.current?.focus()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

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
    }

    container.addEventListener('scroll', handleScroll)
    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50">
        <div 
          className="h-full bg-blue-600 transition-all duration-50"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main 
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory" 
        tabIndex={0}
      >
        <PresentationDoc components={components} />
      </main>
    </>
  )
}

export default App
