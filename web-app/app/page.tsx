"use client"

import Link from "next/link"
import Image from "next/image"
import { Leaf, Menu, Camera, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"
import { useEffect, useState, useRef } from "react"
import { apiService, ClassificationResult } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { theme } = useTheme()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [selectedCrop, setSelectedCrop] = useState<string>("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("Current theme:", theme)
    console.log("HTML classes:", document.documentElement.classList.value)
  }, [theme])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setError(null)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleAnalyze = async () => {
    if (!selectedImage || !selectedCrop) {
      setError("Please select both an image and crop type")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await apiService.classifyImage(selectedImage, selectedCrop)

      // Store the result and image in sessionStorage to pass to result page
      sessionStorage.setItem('classificationResult', JSON.stringify(result))
      sessionStorage.setItem('analysisImage', imagePreview || '')

      // Navigate to result page
      router.push('/result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600" />
            <span className="text-xl font-medium text-gray-900 dark:text-white">Detect Crop Disease</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-8">
            Detect crop diseases instantly with AI
          </h1>

          {/* Upload Area */}
          <div
            className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 mb-6 cursor-pointer hover:border-green-500 dark:hover:border-green-500 transition-colors"
            onClick={handleUploadClick}
          >
            {imagePreview ? (
              <div className="relative">
                <Image
                  src={imagePreview}
                  alt="Selected crop image"
                  width={200}
                  height={200}
                  className="rounded-lg mx-auto object-cover"
                />
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Click to change image
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">Upload or take an image</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports JPEG, PNG formats
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Crop Selection */}
          <div className="mb-6">
            <Select onValueChange={setSelectedCrop} value={selectedCrop}>
              <SelectTrigger className="w-full max-w-md mx-auto">
                <SelectValue placeholder="Select Crop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cashew">Cashew</SelectItem>
                <SelectItem value="cassava">Cassava</SelectItem>
                <SelectItem value="maize">Maize</SelectItem>
                <SelectItem value="tomato">Tomato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text Input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Enter additional notes (optional)"
              className="w-full max-w-md mx-auto px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md mx-auto">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!selectedImage || !selectedCrop || isAnalyzing}
            className="w-full max-w-md bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 text-lg"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing...
              </div>
            ) : (
              'Analyze'
            )}
          </Button>
        </div>

        {/* Latest Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Latest Analysis</h2>
          <div className="flex items-center gap-4 p-2">
            <Image
              src="/placeholder.svg?height=60&width=60"
              alt="Plant leaf"
              width={60}
              height={60}
              className="rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No recent analysis</h3>
              <p className="text-gray-500 dark:text-gray-400">Upload an image to get started</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
