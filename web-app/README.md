# GreenCheck Web Application

A modern web application for AI-powered crop disease detection and agricultural advisory. Built with Next.js and TypeScript, featuring real-time disease classification and intelligent farming recommendations.

## 🌐 Live Demo

**Access the application at:** [https://crop-classifier.vercel.app/](https://crop-classifier.vercel.app/)

## 🚀 Features

### Core Functionality
- **🔍 AI Disease Detection**: Upload crop images for instant disease identification
- **🌱 Multi-Crop Support**: Supports Cashew, Cassava, Maize, and Tomato crops
- **🧠 AI Advisory**: Get personalized farming advice and treatment recommendations
- **📊 Confidence Scoring**: Detailed confidence ratings for disease predictions
- **💬 Interactive Q&A**: Ask specific questions and get tailored advice
- **🌓 Dark/Light Mode**: Responsive theme switching
- **📱 Mobile Responsive**: Optimized for all device sizes

### Disease Analysis Features
- **Instant Classification**: Real-time disease detection with 92-99% accuracy
- **Top Predictions**: Multiple disease possibilities with confidence scores
- **Detailed Descriptions**: Comprehensive disease information and symptoms
- **Treatment Guidance**: Step-by-step treatment recommendations
- **Prevention Tips**: Proactive measures to prevent disease spread
- **Monitoring Instructions**: Guidelines for ongoing crop health monitoring

## 🛠️ Technology Stack

- **Framework**: Next.js 15.2+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Theme**: next-themes for dark/light mode
- **State Management**: React hooks
- **API Integration**: Custom API service with AWS App Runner backend
- **Deployment**: Vercel

## 📋 Prerequisites

Before running the application locally, ensure you have:

- **Node.js** 18.0 or higher
- **npm**, **yarn**, or **pnpm** package manager
- **Git** for version control

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/pryyyynz/Crop-Classifier.git
cd web-app
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

Using pnpm:
```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://iumqtt2ins.eu-west-1.awsapprunner.com

# Optional: For local development
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5003
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### Basic Disease Detection

1. **Upload Image**: Click the upload area or drag and drop a crop image
2. **Select Crop Type**: Choose from Cashew, Cassava, Maize, or Tomato
3. **Enable AI Advice** (Optional): Toggle for comprehensive farming recommendations
4. **Ask Questions** (Optional): Input specific questions about your crop
5. **Analyze**: Click "Analyze Disease" to get instant results

### Understanding Results

The analysis provides:

- **Disease Identification**: Primary disease detected with confidence percentage
- **Health Status**: Whether the crop is healthy or diseased
- **Alternative Predictions**: Other possible diseases with their confidence scores
- **AI Advisory** (if enabled):
  - **Causes**: What causes the detected disease
  - **Immediate Actions**: Urgent steps to take
  - **Treatment Options**: Recommended treatments and interventions
  - **Prevention Strategies**: How to prevent future occurrences
  - **Monitoring Guide**: Ongoing monitoring recommendations
  - **Question Answers**: Responses to your specific questions

### Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- Maximum file size: 10MB (recommended: under 5MB for faster processing)

### Best Practices for Image Capture

- **Clear Focus**: Ensure the disease symptoms are clearly visible
- **Good Lighting**: Natural daylight provides best results
- **Close-up Shots**: Capture affected leaves or plant parts in detail
- **Multiple Angles**: Consider taking several photos of different affected areas
- **Avoid Shadows**: Minimize shadows that might obscure symptoms

## 🏗️ Project Structure

```
web-app/
├── app/                          # Next.js App Router pages
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Home page with upload interface
│   └── result/
│       └── page.tsx             # Results display page
├── components/                   # Reusable React components
│   ├── theme-provider.tsx       # Theme context provider
│   ├── theme-toggle.tsx         # Dark/light mode toggle
│   └── ui/                      # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...                  # Other UI primitives
├── lib/                         # Utility libraries
│   ├── api.ts                   # API service and types
│   └── utils.ts                 # Helper functions
├── public/                      # Static assets
├── styles/                      # Additional stylesheets
│   └── globals.css              # Extended global styles
├── package.json                 # Dependencies and scripts
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── next.config.mjs              # Next.js configuration
```

## 🔧 Configuration

### Tailwind CSS

The application uses a custom Tailwind configuration with:
- Custom color palette for light/dark themes
- Extended spacing and typography scales
- Custom animations and transitions
- Radix UI integration

### Theme System

Built-in theme system supporting:
- **Light Mode**: Clean, professional appearance
- **Dark Mode**: Reduced eye strain for low-light usage
- **System**: Automatically matches user's system preference
- **Persistent**: Theme preference saved across sessions

### API Features

- **Multi-part form upload** for image files
- **Real-time processing** with loading states
- **Error handling** with user-friendly messages
- **AI advice integration** with Groq LLM
- **Confidence scoring** for disease predictions

## 🐛 Troubleshooting

### Common Issues

**Image Upload Fails**
- Check file size (max 10MB)
- Verify file format (JPEG, PNG only)
- Ensure stable internet connection

**Analysis Takes Too Long**
- Large images may take longer to process
- Check network connection
- Try compressing the image

**API Connection Errors**
- Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Check if backend service is running
- Confirm CORS settings
