"use client"

import Link from "next/link"
import Image from "next/image"
import { Leaf, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { ClassificationResult } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function ResultPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("Current theme:", theme)
    console.log("HTML classes:", document.documentElement.classList.value)

    // Get the classification result from sessionStorage
    const storedResult = sessionStorage.getItem('classificationResult')
    const storedImage = sessionStorage.getItem('analysisImage')

    if (storedResult) {
      setResult(JSON.parse(storedResult))
    }
    if (storedImage) {
      setImageUrl(storedImage)
    }
    setLoading(false)
  }, [theme])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-4">No Results Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Please analyze an image first.</p>
          <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
            <Link href="/">Go Back</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Format disease name for display
  const formatDiseaseName = (name: string) => {
    return name.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Get health status color
  const getHealthStatusColor = () => {
    return result.is_healthy ? 'text-green-600' : 'text-red-600'
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
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          {/* Disease Image */}
          <div className="mb-6">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Analyzed crop image"
                width={400}
                height={250}
                className="rounded-lg mx-auto object-cover"
              />
            ) : (
              <div className="w-400 h-250 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No image available</p>
              </div>
            )}
          </div>

          {/* Disease Information */}
          <div className="mb-6">
            <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-4">
              Disease: {formatDiseaseName(result.predicted_disease)}
            </h1>
            <p className={`text-lg font-medium mb-2 ${getHealthStatusColor()}`}>
              Confidence: {result.confidence}%
            </p>
            <p className={`text-sm font-medium mb-6 ${getHealthStatusColor()}`}>
              Status: {result.is_healthy ? 'Healthy' : 'Diseased'}
            </p>

            {/* Top Predictions */}
            {result.top_predictions && result.top_predictions.length > 1 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Top Predictions</h3>
                <div className="space-y-2">
                  {result.top_predictions.slice(0, 3).map((prediction, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatDiseaseName(prediction.disease)}
                      </span>
                      <span className="text-green-600 font-medium">
                        {prediction.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Results Section */}
            <div className="text-left bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Analysis Results</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                <strong>Crop Type:</strong> {result.crop_type.charAt(0).toUpperCase() + result.crop_type.slice(1)}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                <strong>Disease:</strong> {formatDiseaseName(result.predicted_disease)}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                <strong>Health Status:</strong> {result.is_healthy ? 'Plant appears healthy' : 'Disease detected'}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Description:</strong> {result.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white py-3 px-6">
              <Link href="/">Analyze Another Image</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 py-3 px-6 bg-transparent"
            >
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
