import { useState, useEffect } from 'react'
import { FilePicker } from './components/FilePicker'
import { DynamicMDX } from './components/DynamicMDX'

function App() {
  const [loadedFile, setLoadedFile] = useState<{ 
    content: string
    fileName: string
    images: Record<string, string>
  } | null>(null)

  // Check if we're in presenter mode and load data from localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mode = params.get('mode')
    
    if (mode === 'presenter' || mode === 'presentation') {
      const storedData = localStorage.getItem('presentation-data')
      if (storedData) {
        try {
          const data = JSON.parse(storedData)
          setLoadedFile(data)
        } catch (error) {
          console.error('Failed to load presentation data:', error)
        }
      }
    }
  }, [])

  const handleFileLoad = (content: string, fileName: string, images: Record<string, string>) => {
    setLoadedFile({ content, fileName, images })
  }

  const handleBack = () => {
    setLoadedFile(null)
    localStorage.removeItem('presentation-data')
  }

  // Show loaded file
  if (loadedFile) {
    return (
      <DynamicMDX 
        content={loadedFile.content} 
        fileName={loadedFile.fileName}
        images={loadedFile.images}
        onBack={handleBack}
      />
    )
  }

  // Show file picker as default/start page
  return <FilePicker onFileLoad={handleFileLoad} />
}

export default App
