# GreenCheck Mobile App

<div align="center">
  <img src="./assets/images/logo.png" alt="GreenCheck Logo" width="120" height="120">
  
  # 🌱 GreenCheck Mobile
  
  **AI-Powered Crop Disease Detection for Farmers**
  
  A React Native mobile application built with Expo that helps farmers detect crop diseases using artificial intelligence. Get instant disease identification, treatment recommendations, and farming advice - even offline!

</div>

---

## 📱 Download Links

- **Android APK**: [Available Here](https://github.com/pryyyynz/Crop-Classifier/releases/download/greencheck/application-greencheck.apk)


## 🚀 Features

### 🔍 AI-Powered Disease Detection
- **Instant Analysis**: Upload or capture crop images for immediate disease identification
- **High Accuracy**: 92-99% accuracy across supported crops using EfficientNet-B1 models
- **Confidence Scoring**: Get confidence percentages for all predictions
- **Multiple Predictions**: See alternative disease possibilities ranked by confidence

### 🌾 Multi-Crop Support
- **Cashew**: Anthracnose, Gumosis, Healthy, Leaf Miner, Red Rust
- **Cassava**: Bacterial Blight, Brown Spot, Green Mite, Healthy, Mosaic
- **Maize**: Fall Armyworm, Grasshopper, Healthy, Leaf Beetle, Leaf Blight, Leaf Spot, Streak Virus
- **Tomato**: Healthy, Leaf Blight, Leaf Curl, Septoria Leaf Spot, Verticillium Wilt

### 🧠 AI-Powered Farming Advisory
- **Comprehensive Analysis**: Get detailed insights into disease causes
- **Treatment Recommendations**: Step-by-step treatment guidance
- **Prevention Strategies**: Proactive measures to prevent disease spread
- **Monitoring Instructions**: Ongoing crop health monitoring guidelines
- **Interactive Q&A**: Ask specific questions and get tailored advice

### 📱 Smart Mobile Features
- **Offline Mode**: Download models for offline disease detection
- **History Tracking**: Keep track of all your crop analyses
- **Dark/Light Theme**: Comfortable viewing in any lighting condition
- **Accessibility**: Adjustable font sizes and high contrast support

### 🔧 Technical Features
- **Real-time Processing**: Fast on-device inference using ONNX models
- **Cloud Sync**: Seamless sync between online and offline modes
- **Smart Caching**: Efficient data management and storage
- **Network Optimization**: Automatic online/offline detection

## 📋 Requirements

### System Requirements
- **iOS**: 12.0 or later (iOS app not available yet)
- **Android**: API level 21 (Android 5.0) or later
- **Storage**: 500MB available space (2GB recommended for offline models)
- **RAM**: 2GB minimum (4GB recommended)
- **Camera**: Required for image capture functionality

### Permissions
- **Camera**: Take photos of crops for analysis
- **Photo Library**: Select existing crop images
- **Storage**: Save analysis history and offline models
- **Network**: Access online features and sync data

## 🛠️ Installation

### For End Users

#### Direct APK Download (Android)
1. Download the latest APK from [our releases page](https://github.com/pryyyynz/Crop-Classifier/releases/tag/greencheck)
2. Enable "Unknown Sources" in your Android settings
3. Install the APK file
4. Open GreenCheck and start analyzing crops!

### For Developers

#### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Expo CLI** installed globally
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

#### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/pryyyynz/Crop-Classifier.git
   cd mobile-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # API Configuration
   API_BASE_URL=https://iumqtt2ins.eu-west-1.awsapprunner.com
   
   # Optional: Local development
   # API_BASE_URL=http://localhost:5003
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Run on Device/Simulator**
   
   **iOS (macOS only):**
   ```bash
   npm run ios
   # or
   yarn ios
   ```
   
   **Android:**
   ```bash
   npm run android
   # or
   yarn android
   ```
   
   **Web:**
   ```bash
   npm run build:web
   # or
   yarn build:web
   ```

## 📖 Usage Guide

### Getting Started

1. **Download and Install** the app from the link above
2. **Allow Permissions** for camera and photo library access
3. **Choose Your Crop Type** from the supported options
4. **Capture or Upload** a clear image of the affected crop
5. **Get Instant Results** with disease identification and advice

### Basic Disease Detection

1. **Launch the App** and navigate to the main scan screen
2. **Select Crop Type**: Choose from Cashew, Cassava, Maize, or Tomato
3. **Capture Image**: 
   - Tap the camera button to take a new photo
   - Or tap "Choose from Gallery" to select an existing image
4. **Enable AI Advice** (optional): Toggle on for comprehensive farming recommendations
5. **Analyze**: Tap "Analyze Disease" to process the image
6. **Review Results**: Get detailed disease information and treatment advice

### Understanding Results

The analysis provides:

- **Disease Identification**: Primary disease detected with confidence percentage
- **Health Status**: Whether the crop is healthy or diseased
- **Alternative Predictions**: Other possible diseases with their confidence scores
- **Detailed Description**: Comprehensive information about the detected condition

### AI Advisory (Online Mode)

When connected to the internet, you get additional insights:

- **🔍 What Causes This?**: Understanding the root causes of the disease
- **⚡ Immediate Actions**: Urgent steps to take right now
- **💊 Treatment Options**: Recommended treatments and interventions
- **🛡️ Prevention Strategies**: How to prevent future occurrences
- **👁️ Monitoring Guide**: Ongoing monitoring recommendations
- **💬 Question Answers**: Responses to your specific questions

### Offline Mode

Download crop models for offline use:

1. Go to **Settings** → **Offline Models**
2. **Download Models** for your specific crops (≈28MB each)
3. **Use Offline**: Analyze crops without internet connection
4. **Sync Later**: Results automatically sync when online

### History and Tracking

- **View Analysis History**: Access all your previous crop analyses
- **Track Progress**: Monitor crop health over time
- **Export Data**: Share results with agricultural experts
- **Statistics Dashboard**: View your crop health statistics

## 🎯 Best Practices

### Image Capture Tips

- **Clear Focus**: Ensure disease symptoms are clearly visible
- **Good Lighting**: Natural daylight provides the best results
- **Close-up Shots**: Capture affected leaves or plant parts in detail
- **Multiple Angles**: Consider taking several photos of different affected areas
- **Avoid Shadows**: Minimize shadows that might obscure symptoms
- **Clean Lens**: Keep your camera lens clean for sharp images

### Optimal Usage

- **Regular Monitoring**: Use the app for routine crop health checks
- **Early Detection**: Analyze crops at first sign of symptoms
- **Follow Advice**: Implement the AI-generated treatment recommendations
- **Track Progress**: Use the history feature to monitor treatment effectiveness
- **Stay Updated**: Keep the app updated for the latest model improvements

## 🔧 Technical Specifications

### Architecture
- **Framework**: React Native with Expo 53.0.20
- **Navigation**: Expo Router with typed routes
- **State Management**: React Context API
- **AI Models**: ONNX Runtime for on-device inference
- **Backend**: FastAPI with AWS App Runner deployment
- **Storage**: AsyncStorage for local data persistence

### Key Dependencies
- **@tensorflow/tfjs-react-native**: TensorFlow.js for mobile ML
- **onnxruntime-react-native**: ONNX model inference
- **expo-image-picker**: Camera and gallery access
- **@react-native-async-storage/async-storage**: Local data storage
- **@react-native-community/netinfo**: Network connectivity detection
- **lucide-react-native**: Modern icon library

### Performance
- **Model Size**: 28MB per crop model (compressed ONNX format)
- **Inference Time**: 2-5 seconds on modern devices
- **Memory Usage**: <200MB during analysis
- **Battery Impact**: Optimized for minimal battery drain

### Security & Privacy
- **Local Processing**: Images processed on-device when offline
- **Data Encryption**: All data transmissions encrypted with HTTPS
- **No Personal Data**: No collection of personal information
- **User Control**: Users control what data is shared

## 📊 Model Performance

### Accuracy Metrics
- **Cashew**: 98.78% accuracy across 5 disease classes
- **Cassava**: 97.45% accuracy across 5 disease classes
- **Maize**: 92.40% accuracy across 7 disease classes
- **Tomato**: 98.38% accuracy across 5 disease classes

### Training Data
- **Total Images**: 102,000+ high-quality crop images
- **Data Source**: [CCMT Dataset](https://data.mendeley.com/datasets/bwh3zbpkpv/1)
- **Validation**: Verified by agricultural experts

## 🐛 Troubleshooting

### Common Issues

**App Won't Start**
- Ensure your device meets minimum requirements
- Try restarting your device
- Reinstall the app if issues persist

**Camera Not Working**
- Check camera permissions in device settings
- Ensure camera is not being used by another app
- Try restarting the app

**Analysis Fails**
- Check internet connection for online features
- Ensure image is clear and well-lit
- Try with a different image
- Check if offline models are downloaded for offline use

**Slow Performance**
- Close other apps to free up memory
- Ensure device has sufficient storage space
- Try clearing app cache in device settings

**Offline Mode Issues**
- Check if models are downloaded in Settings
- Ensure sufficient storage space (2GB recommended)
- Try redownloading models if analysis fails