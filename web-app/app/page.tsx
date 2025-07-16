"use client" // This page needs to be a client component to use hooks like useTheme

import Link from "next/link"
import Image from "next/image"
import { Leaf, Menu, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes" // Import useTheme
import { useEffect } from "react" // Import useEffect

export default function HomePage() {
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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-8">
            Detect crop diseases instantly with AI
          </h1>

          {/* Upload Area */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 mb-6">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-300">Upload or take an image</p>
          </div>

          {/* Crop Selection */}
          <div className="mb-6">
            <Select>
              <SelectTrigger className="w-full max-w-md mx-auto">
                <SelectValue placeholder="Select Crop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tomato">Tomato</SelectItem>
                <SelectItem value="potato">Potato</SelectItem>
                <SelectItem value="corn">Corn</SelectItem>
                <SelectItem value="wheat">Wheat</SelectItem>
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

          {/* Analyze Button */}
          <Button asChild className="w-full max-w-md bg-green-600 hover:bg-green-700 text-white py-3 text-lg">
            <Link href="/result">Analyze</Link>
          </Button>
        </div>

        {/* Latest Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Latest Analysis</h2>
          <Link
            href="/result"
            className="flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
          >
            <Image
              src="/placeholder.svg?height=60&width=60"
              alt="Plant leaf"
              width={60}
              height={60}
              className="rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bacterial Blight</h3>
              <p className="text-green-600 font-medium">Confidence: 96,4%</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
