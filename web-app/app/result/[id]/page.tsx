"use client" // This page needs to be a client component to use hooks like useTheme

import Link from "next/link"
import Image from "next/image"
import { Leaf, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes" // Import useTheme
import { useEffect } from "react" // Import useEffect

export default function ResultPage() {
  const { theme } = useTheme() // Get the current theme

  useEffect(() => {
    console.log("Current theme:", theme)
    console.log("HTML classes:", document.documentElement.classList.value)
  }, [theme])

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
          {/* Disease Image - Made smaller */}
          <div className="mb-6">
            <Image
              src="/placeholder.svg?height=250&width=400"
              alt="Diseased plant leaf"
              width={400}
              height={250}
              className="rounded-lg mx-auto object-cover"
            />
          </div>

          {/* Disease Information */}
          <div className="mb-6">
            <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-4">Disease: Bacterial Blight</h1>
            <p className="text-lg text-green-600 font-medium mb-6">Confidence: 96,4%</p>

            {/* Text Results Section */}
            <div className="text-left bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Analysis Results</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                <strong>Disease Type:</strong> Bacterial infection affecting leaf tissue
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                <strong>Severity:</strong> Moderate to severe symptoms detected
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                <strong>Recommended Action:</strong> Apply copper-based fungicide and remove affected leaves
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Prevention:</strong> Ensure proper air circulation and avoid overhead watering
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white py-3 px-6">
              <Link href="/">Take Another Photo</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 py-3 px-6 bg-transparent"
            >
              <Link href="/">Back</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
