import { useState } from 'react'
import JSZip from 'jszip'

interface FilePickerProps {
  onFileLoad: (content: string, fileName: string, images: Record<string, string>) => void
}

export function FilePicker({ onFileLoad }: FilePickerProps) {
  const [isDragging, setIsDragging] = useState(false)

  const processZipFile = async (file: File) => {
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(file)
    
    let mdxContent = ''
    let mdxFileName = ''
    const images: Record<string, string> = {}
    
    for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
      if (zipEntry.dir) continue
      
      if (filename.endsWith('.mdx') || filename.endsWith('.md')) {
        mdxContent = await zipEntry.async('text')
        mdxFileName = filename
      }
      // Check if it's an image or video
      else if (/\.(png|jpg|jpeg|gif|svg|webp|mp4|webm|ogg|mov)$/i.test(filename)) {
        const blob = await zipEntry.async('blob')
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        images[filename] = dataUrl
      }
    }
    
    if (!mdxContent) {
      throw new Error('Keine MDX-Datei in der ZIP-Datei gefunden')
    }
    
    return { content: mdxContent, fileName: mdxFileName, images }
  }

  const handleFileSelect = async () => {
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'ZIP Files',
            accept: {
              'application/zip': ['.zip']
            }
          }
        ],
        multiple: false
      })

      const file = await fileHandle.getFile()
      const { content, fileName, images } = await processZipFile(file)
      onFileLoad(content, fileName, images)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Fehler beim Laden der Datei:', err)
        alert('Fehler beim Laden der Datei: ' + (err as Error).message)
      }
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const zipFile = files.find(f => f.name.endsWith('.zip'))

    if (zipFile) {
      try {
        const { content, fileName, images } = await processZipFile(zipFile)
        onFileLoad(content, fileName, images)
      } catch (err) {
        console.error('Fehler beim Verarbeiten der ZIP-Datei:', err)
        alert('Fehler beim Verarbeiten der ZIP-Datei: ' + (err as Error).message)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-2xl w-full mx-auto px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            MDX Präsentation
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Öffne eine ZIP-Datei mit deiner MDX-Präsentation
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-4 border-dashed rounded-2xl p-16 transition-all duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-105' 
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            }
          `}
        >
          <div className="text-center">
            <svg
              className="mx-auto h-24 w-24 text-slate-400 dark:text-slate-600 mb-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
              Ziehe eine ZIP-Datei hierher
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-8">
              oder
            </p>

            <button
              onClick={handleFileSelect}
              className="
                px-8 py-4 
                bg-blue-600 hover:bg-blue-700 
                text-white font-semibold 
                rounded-xl 
                transition-all duration-200 
                shadow-lg hover:shadow-xl 
                hover:scale-105
                focus:outline-none focus:ring-4 focus:ring-blue-500/50
              "
            >
              ZIP-Datei auswählen
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-slate-500 dark:text-slate-500">
          <p className="mb-2">📦 Die ZIP-Datei sollte enthalten:</p>
          <p className="mb-2">• Eine MDX-Datei (.mdx oder .md)</p>
          <p className="mb-2">• Optional: Bilder (PNG, JPG, GIF, SVG, WebP)</p>
          <p>• Optional: Videos (MP4, WebM, OGG, MOV)</p>
          <p className="mt-4">
            📜 Nutze <code className="px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded">---</code> als Trennung zwischen Slides
          </p>
        </div>
      </div>
    </div>
  )
}
