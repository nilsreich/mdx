import { useEffect, useState, useRef } from 'react'

interface PresenterViewProps {
  currentSlideIndex: number
  totalSlides: number
  onSlideChange: (index: number) => void
  containerRef: React.RefObject<HTMLElement | null>
  onBack?: () => void
}

export function PresenterView({ 
  currentSlideIndex, 
  totalSlides, 
  onSlideChange,
  containerRef,
  onBack
}: PresenterViewProps) {
  const [currentNotes, setCurrentNotes] = useState<string>('')
  const [nextSlidePreview, setNextSlidePreview] = useState<string>('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const startTimeRef = useRef<number>(Date.now())
  const broadcastChannel = useRef<BroadcastChannel | null>(null)

  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) {
      onSlideChange(index)
    }
  }

  const handleBack = () => {
    if (onBack) {
      window.opener?.postMessage({ type: 'CLOSE_PRESENTATION' }, '*')
      window.close()
    } else {
      window.close()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    broadcastChannel.current = new BroadcastChannel('presentation-sync')

    broadcastChannel.current.onmessage = (event) => {
      if (event.data.type === 'SLIDE_CHANGE') {
        onSlideChange(event.data.slideIndex)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToSlide(currentSlideIndex - 1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToSlide(currentSlideIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      broadcastChannel.current?.close()
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onSlideChange, currentSlideIndex])

  useEffect(() => {
    if (broadcastChannel.current) {
      broadcastChannel.current.postMessage({
        type: 'SLIDE_CHANGE',
        slideIndex: currentSlideIndex
      })
    }
  }, [currentSlideIndex])

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const slides = containerRef.current.querySelectorAll('section')
    const currentSlide = slides[currentSlideIndex]
    const nextSlide = slides[currentSlideIndex + 1]

    if (currentSlide) {
      const notesElement = currentSlide.querySelector('[data-speaker-notes]')
      setCurrentNotes(notesElement?.textContent || '')
    } else {
      setCurrentNotes('')
    }

    if (nextSlide) {
      const clone = nextSlide.cloneNode(true) as HTMLElement
      const notesToRemove = clone.querySelectorAll('[data-speaker-notes]')
      notesToRemove.forEach(note => note.remove())
      setNextSlidePreview(clone.innerHTML)
    } else {
      setNextSlidePreview('')
    }
  }, [currentSlideIndex, containerRef])

  if (!containerRef.current) {
    return <div className="fixed inset-0 bg-white dark:bg-neutral-950 flex items-center justify-center text-gray-900 dark:text-white">
      <div>Lade Presenter View...</div>
    </div>
  }

  const currentSlideHTML = containerRef.current.querySelectorAll('section')[currentSlideIndex]?.innerHTML.replace(/<div[^>]*data-speaker-notes[^>]*>.*?<\/div>/gs, '') || ''

  return (
    <div className="fixed inset-0 bg-white dark:bg-neutral-950 text-gray-900 dark:text-white overflow-hidden">
      {/* Header */}
      <div className="h-14 bg-gray-100 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Presenter View</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-xl font-mono">{formatTime(elapsedTime)}</div>
          
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            ← Zurück
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="h-[calc(100vh-3.5rem)] flex gap-3 p-3">
        {/* Left side - Current slide (larger) */}
        <div className="flex-[3] flex flex-col">
          <div className="flex-1 bg-neutral-50 dark:bg-neutral-900 rounded-lg overflow-hidden flex flex-col border border-neutral-200 dark:border-neutral-800">
            <div className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-xs font-medium">
              Aktuelle Folie
            </div>
            <div className="flex-1 relative overflow-hidden bg-white dark:bg-neutral-950 flex items-center justify-center p-4">
              <div 
                className="prose prose-neutral dark:prose-invert max-w-none"
                style={{ 
                  transform: 'scale(0.65)', 
                  transformOrigin: 'center center',
                  maxHeight: 'calc(100vh - 8rem)',
                  width: '153.8%'
                }}
                dangerouslySetInnerHTML={{ __html: currentSlideHTML }}
              />
            </div>
          </div>
        </div>

        {/* Right side - Next slide preview and notes */}
        <div className="flex-[2] flex flex-col gap-3">
          {/* Next slide preview (larger) */}
          {nextSlidePreview && (
            <div className="flex-[2] bg-neutral-50 dark:bg-neutral-900 rounded-lg overflow-hidden flex flex-col border border-neutral-200 dark:border-neutral-800">
              <div className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-xs font-medium">
                Nächste Folie
              </div>
              <div className="flex-1 relative overflow-hidden bg-white dark:bg-neutral-950 flex items-center justify-center p-2">
                <div 
                  className="prose prose-neutral dark:prose-invert max-w-none"
                  style={{ 
                    transform: 'scale(0.35)', 
                    transformOrigin: 'center center',
                    maxHeight: 'calc(50vh - 8rem)',
                    width: '285.7%'
                  }}
                  dangerouslySetInnerHTML={{ __html: nextSlidePreview }}
                />
              </div>
            </div>
          )}

          {/* Speaker notes */}
          <div className="flex-[2] bg-neutral-50 dark:bg-neutral-900 rounded-lg overflow-hidden flex flex-col border border-neutral-200 dark:border-neutral-800">
            <div className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-xs font-medium">
              Notizen
            </div>
            <div className="flex-1 overflow-auto p-4">
              {currentNotes ? (
                <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none whitespace-pre-wrap">
                  {currentNotes}
                </div>
              ) : (
                <div className="text-neutral-500 dark:text-neutral-400 text-sm italic">
                  Keine Notizen für diese Folie
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => goToSlide(currentSlideIndex - 1)}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentSlideIndex === 0}
              >
                ← Zurück
              </button>
              
              <div className="text-lg font-semibold">
                {currentSlideIndex + 1} / {totalSlides}
              </div>
              
              <button
                onClick={() => goToSlide(currentSlideIndex + 1)}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentSlideIndex === totalSlides - 1}
              >
                Weiter →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
