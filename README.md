# 🌱 GreenCheck - AI-Powered Crop Disease Detection

<div align="center">
  
  **AI solution for detecting diseases in Ghanaian crops**
  
  *Ghana AI Hackathon by Bridge Labs*

  [![Backend API](https://img.shields.io/badge/API-Live-green)](https://iumqtt2ins.eu-west-1.awsapprunner.com/docs)
  [![Web App](https://img.shields.io/badge/Web%20App-Live-blue)](https://crop-classifier.vercel.app)
  [![Mobile App](https://img.shields.io/badge/Mobile%20App-APK-orange)](https://github.com/pryyyynz/Crop-Classifier/releases/tag/greencheck)

</div>

---

## 🎯 Project Overview

GreenCheck is an AI-powered crop disease detection system designed for farmers. The project consists of three main components working together to provide accurate disease identification, treatment recommendations, and farming advisory services.

### 🌾 Supported Crops
- **Cashew** - 5 disease classifications (98.78% accuracy)
- **Cassava** - 5 disease classifications (96.84% accuracy)  
- **Maize** - 7 disease classifications (92.4% accuracy)
- **Tomato** - 5 disease classifications (98.38% accuracy)

### 🚀 Key Features
- **Real-time Disease Detection** with 92-99% accuracy
- **AI-Powered Treatment Recommendations** using advanced LLM integration
- **Offline Mobile Functionality** with downloadable models
- **Multi-Platform Support** (Web, Mobile, API)
- **Comprehensive Disease Database** with prevention strategies
- **Interactive Q&A System** for personalized farming advice

---

## 📁 Project Structure

This repository contains three main components, each with detailed documentation:

### 🔧 [Backend API](./backend/README.md)
**FastAPI-based ML service with cloud deployment**
- EfficientNet-B1 deep learning models
- Groq LLM integration for AI advice
- AWS S3 model storage and AWS App Runner deployment
- RESTful API with comprehensive documentation
- Real-time disease classification and confidence scoring

### 📱 [Mobile Application](./mobile-app/README.md)
**React Native app with offline capabilities**
- Cross-platform iOS/Android support
- Offline model inference using ONNX Runtime
- Camera integration and image capture
- History tracking and analysis dashboard
- Dark/light theme and accessibility features

### 🌐 [Web Application](./web-app/README.md)
**Next.js web interface with modern UI**
- Responsive design with Tailwind CSS
- Real-time image upload and analysis
- Interactive results visualization
- Theme switching and mobile optimization
- Progressive Web App capabilities

---

## 🎪 Live Demos & Downloads

### 🌐 Web Application
**Try it now:** [https://crop-classifier.vercel.app](https://crop-classifier.vercel.app)

### 📱 Mobile Application
**Android APK:** [Download here](https://github.com/pryyyynz/Crop-Classifier/releases/download/greencheck/application-greencheck.apk)

### 🔧 API Documentation
**Backend API:** [https://iumqtt2ins.eu-west-1.awsapprunner.com](https://iumqtt2ins.eu-west-1.awsapprunner.com/docs)

---

## 🚀 Quick Start

### For End Users
1. **Web App**: Visit [crop-classifier.vercel.app](https://crop-classifier.vercel.app) and upload crop images
2. **Mobile App**: Download the APK and install on Android devices
3. **API**: Use the REST API endpoints for integration with other systems

### For Developers
Each component has detailed setup instructions in their respective README files:

- **Backend Setup**: See [backend/README.md](./backend/README.md)
- **Mobile Development**: See [mobile-app/README.md](./mobile-app/README.md)
- **Web Development**: See [web-app/README.md](./web-app/README.md)

---

## 🏆 Model Performance

Our AI models achieve exceptional accuracy across all supported crops:

| Crop | Accuracy | Test Images | Disease Classes |
|------|----------|-------------|-----------------|
| **Cashew** | 98.78% | 6,549 | 5 (Anthracnose, Gumosis, Healthy, Leaf Miner, Red Rust) |
| **Cassava** | 96.84% | 4,015 | 5 (Bacterial Blight, Brown Spot, Green Mite, Healthy, Mosaic) |
| **Maize** | 92.40% | 5,321 | 7 (Fall Armyworm, Grasshopper, Healthy, Leaf Beetle, Leaf Blight, Leaf Spot, Streak Virus) |
| **Tomato** | 98.38% | 5,792 | 5 (Healthy, Leaf Blight, Leaf Curl, Septoria Leaf Spot, Verticillium Wilt) |

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI with Python
- **ML**: PyTorch + EfficientNet-B1
- **LLM**: Groq API integration
- **Cloud**: AWS S3 + AWS App Runner
- **Database**: File-based with JSON metadata

### Mobile
- **Framework**: React Native + Expo
- **ML**: ONNX Runtime for on-device inference
- **Navigation**: Expo Router
- **Storage**: AsyncStorage
- **Network**: NetInfo for connectivity detection

### Web
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **Theme**: next-themes
- **Deployment**: Vercel
- **API**: Custom service with error handling

---

## 📊 Usage Statistics

- **Supported Countries**: Primary focus on Ghana 🇬🇭
- **Disease Classifications**: 22 total disease types
- **Model Size**: ~28MB per crop (mobile ONNX format)
- **API Response Time**: <3 seconds average
- **Offline Functionality**: Full mobile support

---

## 🎯 Use Cases

### 👨‍🌾 For Farmers
- **Quick Disease Identification**: Upload crop photos for instant diagnosis
- **Treatment Guidance**: Get step-by-step treatment recommendations
- **Prevention Strategies**: Learn how to prevent disease spread
- **Offline Access**: Use mobile app without internet connection

### 🏢 For Agricultural Organizations
- **Scalable Deployment**: Deploy across multiple regions
- **Custom Integration**: API-first architecture for easy integration
- **Training Programs**: Educational resources for farmers

---

## 📄 Documentation

Detailed documentation is available for each component:

- **🔧 [Backend API Documentation](./backend/README.md)** - Model training, API endpoints, deployment
- **📱 [Mobile App Documentation](./mobile-app/README.md)** - Installation, features, offline capabilities
- **🌐 [Web App Documentation](./web-app/README.md)** - Setup, configuration, deployment

---

## 🤝 Contributing

We welcome contributions to improve GreenCheck! Here's how you can help:

1. **Fork the repository**
2. **Choose a component** (backend, mobile, or web)
3. **Read the specific README** for setup instructions
4. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
5. **Make your changes** and add tests
6. **Submit a pull request** with clear description

### Development Guidelines
- Follow the coding standards in each component's README
- Add tests for new features
- Update documentation as needed
- Ensure all components work together

---

## 🏆 Acknowledgments

- **Ghana AI Hackathon** by Bridge Labs for inspiring this project
- **Dataset** CCMT Dataset for Crop Pest and Disease Detection
- **Open Source Community** for the amazing tools and libraries

---

## 📧 Contact & Support

- **Technical Issues**: Create an issue in this repository
- **General Inquiries**: dugboryeleprince@gmail.com
