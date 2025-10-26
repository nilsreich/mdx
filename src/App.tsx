import { useState } from 'react'
import { FilePicker } from './components/FilePicker'
import { DynamicMDX } from './components/DynamicMDX'

function App() {
  const [loadedFile, setLoadedFile] = useState<{ 
    content: string
    fileName: string
    images: Record<string, string>
  } | null>(null)

  const handleFileLoad = (content: string, fileName: string, images: Record<string, string>) => {
    setLoadedFile({ content, fileName, images })
  }

  const handleBack = () => {
    setLoadedFile(null)
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
