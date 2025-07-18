"use client"

import Link from "next/link"
import Image from "next/image"
import { Leaf, Menu, Brain, AlertTriangle, CheckCircle, Clock, Eye, MessageCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Get stored result from sessionStorage
    const storedResult = sessionStorage.getItem('classificationResult')
    const storedImage = sessionStorage.getItem('analysisImage')

    if (storedResult) {
      const parsedResult = JSON.parse(storedResult)
      setResult(parsedResult)
    }
    if (storedImage) {
      setImageUrl(storedImage)
    }
    setLoading(false)
  }, [mounted])

  // Show loading state during hydration
  if (!mounted || loading) {
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

  const getHealthStatusIcon = () => {
    return result.is_healthy ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />
  }

  // Check if AI advice was requested but not yet available
  const aiAdviceRequested = result.user_question || result.notes
  const shouldShowAiLoading = aiAdviceRequested && !result.ai_advice && !result.ai_advice_error

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600" />
            <span className="text-xl font-medium text-gray-900 dark:text-white">Analysis Results</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image and Basic Results */}
          <div className="space-y-6">
            {/* Disease Image */}
            <Card>
              <CardContent className="p-6">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Analyzed crop image"
                    width={400}
                    height={300}
                    className="rounded-lg mx-auto object-cover w-full h-64"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">No image available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Disease Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getHealthStatusIcon()}
                  {formatDiseaseName(result.predicted_disease)}
                </CardTitle>
                <CardDescription>
                  Confidence: {result.confidence}% • {result.is_healthy ? 'Healthy Plant' : 'Disease Detected'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Crop Type:</p>
                  <Badge variant="secondary">{result.crop_type.charAt(0).toUpperCase() + result.crop_type.slice(1)}</Badge>
                </div>

                {/* Top Predictions */}
                {result.top_predictions && result.top_predictions.length > 1 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Predictions:</p>
                    <div className="space-y-2">
                      {result.top_predictions.slice(0, 3).map((prediction, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {formatDiseaseName(prediction.disease)}
                          </span>
                          <Badge variant="outline">
                            {prediction.confidence}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Basic Description:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{result.description}</p>
                </div>

                {/* User Question */}
                {result.user_question && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        Your Question:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-400">
                        {result.user_question}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Advice */}
          <div className="space-y-6">
            {result.ai_advice ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      AI Agricultural Advisor
                    </CardTitle>
                    <CardDescription>
                      Personalized farming advice powered by AI
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Answer to User Question - Show FIRST if exists */}
                {result.ai_advice.question_answer && result.user_question && (
                  <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Answer to Your Question
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {result.ai_advice.question_answer}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Causes */}
                {result.ai_advice.causes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-orange-600 dark:text-orange-400">
                        🔍 What Causes This?
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {result.ai_advice.causes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Immediate Actions */}
                {result.ai_advice.immediate_actions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600 dark:text-red-400">
                        ⚡ Immediate Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {result.ai_advice.immediate_actions}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Treatment */}
                {result.ai_advice.treatment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-600 dark:text-blue-400">
                        💊 Treatment Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {result.ai_advice.treatment}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Prevention */}
                {result.ai_advice.prevention && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-green-600 dark:text-green-400">
                        🛡️ Prevention Strategies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {result.ai_advice.prevention}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Monitoring */}
                {result.ai_advice.monitoring && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-purple-600 dark:text-purple-400 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Monitoring Guide
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {result.ai_advice.monitoring}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : shouldShowAiLoading ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      AI Agricultural Advisor
                    </CardTitle>
                    <CardDescription>
                      Generating personalized farming advice...
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Question Answer Loading Placeholder */}
                {result.user_question && (
                  <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Answer to Your Question
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Preparing your personalized answer...</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Loading State */}
                <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                  <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                        <Brain className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-2">
                          Generating AI Advice...
                        </h3>
                        <p className="text-purple-600 dark:text-purple-400 text-sm">
                          Our AI agricultural expert is analyzing your crop and preparing personalized recommendations.
                        </p>
                      </div>
                      <div className="w-full max-w-xs bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full animate-pulse w-3/5"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* General Advice Loading Placeholders */}
                <div className="space-y-4">
                  {['🔍 What Causes This?', '⚡ Immediate Actions', '💊 Treatment Options', '🛡️ Prevention Strategies', '👁️ Monitoring Guide'].map((title, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg text-gray-500 dark:text-gray-400">
                          {title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/5"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/5"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : aiAdviceRequested ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    AI Advice Not Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {result.ai_advice_error || "AI advice generation failed. Please try again."}
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/">Try Again</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    AI Advice Not Requested
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Enable AI advice on the analysis page to get personalized farming recommendations.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/">Analyze with AI Advice</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-8">
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
      </main>
    </div>
  )
}
