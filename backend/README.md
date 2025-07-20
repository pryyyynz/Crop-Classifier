# Crop Disease Classification Backend API

A FastAPI-based backend service for AI-powered crop disease detection supporting Cashew, Cassava, Maize, and Tomato crops. The service uses EfficientNet-B1 deep learning models to classify plant diseases from uploaded images with high accuracy.

## 🌐 Live API
**Base URL:** https://iumqtt2ins.eu-west-1.awsapprunner.com/docs

## 🚀 Features

- **Multi-crop Support**: Classifies diseases in Cashew, Cassava, Maize, and Tomato
- **High Accuracy Models**: EfficientNet-B1 based models with 92-99% accuracy
- **AI-Powered Advice**: Groq LLM integration for disease management recommendations
- **Real-time Classification**: Fast inference with confidence scores
- **RESTful API**: Well-documented FastAPI endpoints
- **Production Ready**: Deployed on AWS App Runner with S3 model storage

## 📊 Model Performance

The models achieve exceptional accuracy across all supported crops:

### Cashew Disease Classification
- **Overall Accuracy**: 98.78%
- **Total Test Images**: 6,549
- **Classes**: Anthracnose, Gumosis, Healthy, Leaf Miner, Red Rust

| Disease | Precision | Recall | F1-Score | Support |
|---------|-----------|--------|----------|---------|
| Anthracnose | 0.970 | 0.990 | 0.980 | 1,729 |
| Gumosis | 1.000 | 1.000 | 1.000 | 392 |
| Healthy | 0.996 | 0.996 | 0.996 | 1,368 |
| Leaf Miner | 0.984 | 0.996 | 0.990 | 1,378 |
| Red Rust | 1.000 | 0.968 | 0.984 | 1,682 |

### Cassava Disease Classification
- **Overall Accuracy**: 98.14%
- **Total Test Images**: 7,508
- **Classes**: Bacterial Blight, Brown Spot, Green Mite, Healthy, Mosaic

| Disease | Precision | Recall | F1-Score | Support |
|---------|-----------|--------|----------|---------|
| Bacterial Blight | 0.966 | 0.998 | 0.982 | 2,614 |
| Brown Spot | 0.996 | 0.955 | 0.975 | 1,481 |
| Green Mite | 0.975 | 0.981 | 0.978 | 1,015 |
| Healthy | 0.995 | 0.979 | 0.987 | 1,193 |
| Mosaic | 0.992 | 0.979 | 0.986 | 1,205 |

### Maize Disease Classification
- **Overall Accuracy**: 92.41%
- **Total Test Images**: 5,321
- **Classes**: Fall Armyworm, Grasshopper, Healthy, Leaf Beetle, Leaf Blight, Leaf Spot, Streak Virus

| Disease | Precision | Recall | F1-Score | Support |
|---------|-----------|--------|----------|---------|
| Fall Armyworm | 0.986 | 0.972 | 0.979 | 285 |
| Grasshopper | 1.000 | 0.996 | 0.998 | 673 |
| Healthy | 0.906 | 0.981 | 0.942 | 206 |
| Leaf Beetle | 0.989 | 0.994 | 0.991 | 938 |
| Leaf Blight | 0.769 | 0.976 | 0.860 | 998 |
| Leaf Spot | 0.972 | 0.743 | 0.842 | 1,249 |
| Streak Virus | 0.950 | 0.961 | 0.955 | 972 |

### Tomato Disease Classification
- **Overall Accuracy**: 98.38%
- **Total Test Images**: 5,792
- **Classes**: Healthy, Leaf Blight, Leaf Curl, Septoria Leaf Spot, Verticillium Wilt

| Disease | Precision | Recall | F1-Score | Support |
|---------|-----------|--------|----------|---------|
| Healthy | 0.977 | 1.000 | 0.988 | 468 |
| Leaf Blight | 0.983 | 0.979 | 0.981 | 1,294 |
| Leaf Curl | 0.975 | 0.967 | 0.971 | 514 |
| Septoria Leaf Spot | 0.988 | 0.989 | 0.989 | 2,743 |
| Verticillium Wilt | 0.979 | 0.973 | 0.976 | 773 |

## 🛠️ Technology Stack

- **Framework**: FastAPI 0.104+
- **ML Framework**: PyTorch 2.0+ with timm
- **Model Architecture**: EfficientNet-B1
- **LLM Integration**: Groq API
- **Cloud Storage**: AWS S3
- **Deployment**: AWS App Runner
- **Image Processing**: Pillow, torchvision
- **API Documentation**: Swagger/OpenAPI

## 📋 Installation

### Prerequisites
- Python 3.8+
- CUDA-compatible GPU (optional, for training)
- AWS credentials (for model storage)
- Groq API key (for AI advice feature)

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/pryyyynz/Crop-Classifier
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
Create a `.env` file in the backend directory:
```env
AWS_DEFAULT_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
GROQ_API_KEY=your_groq_api_key
```

5. **Run the development server**
```bash
python api/main.py
```

The API will be available at `http://localhost:5003`

## 🔧 API Endpoints

### Base Information
- **GET /** - API information and health status
- **GET /health** - Health check endpoint

### Classification
- **POST /api/classify** - Classify crop disease from image

### Crop Information
- **GET /api/crops** - Get all supported crop types
- **GET /api/crops/{crop_type}** - Get specific crop information

## 📖 API Usage

### Disease Classification

**Endpoint**: `POST /api/classify`

**Parameters**:
- `image` (file): Image file (JPEG, PNG)
- `crop_type` (string): Crop type (`cashew`, `cassava`, `maize`, `tomato`)
- `notes` (string, optional): Additional notes about the plant
- `user_question` (string, optional): Specific question about the disease
- `enable_ai_advice` (boolean, default: true): Enable AI-powered advice

**Example Request**:
```bash
curl -X POST "https://iumqtt2ins.eu-west-1.awsapprunner.com/api/classify" \
  -F "image=@plant_image.jpg" \
  -F "crop_type=tomato" \
  -F "notes=Leaves showing yellow spots" \
  -F "user_question=What treatment do you recommend?" \
  -F "enable_ai_advice=true"
```

**Example Response**:
```json
{
  "crop_type": "tomato",
  "predicted_disease": "septoria_leaf_spot",
  "confidence": 95.67,
  "is_healthy": false,
  "description": "Septoria leaf spot causes small, circular spots with dark borders. Management includes crop rotation, proper spacing, and fungicide applications when necessary.",
  "top_predictions": [
    {
      "disease": "septoria_leaf_spot",
      "confidence": 95.67
    },
    {
      "disease": "leaf_blight",
      "confidence": 3.21
    },
    {
      "disease": "healthy",
      "confidence": 1.12
    }
  ],
  "ai_advice": {
    "treatment_recommendations": [
      "Remove affected leaves immediately",
      "Apply copper-based fungicide",
      "Improve air circulation around plants"
    ],
    "prevention_tips": [
      "Water at soil level to avoid wetting leaves",
      "Practice crop rotation",
      "Maintain proper plant spacing"
    ],
    "severity_assessment": "Moderate infection - early intervention recommended"
  },
  "filename": "plant_image.jpg",
  "file_size": 234567,
  "status": "success"
}
```

### Get Supported Crops

**Endpoint**: `GET /api/crops`

**Example Response**:
```json
{
  "supported_crops": ["cashew", "cassava", "maize", "tomato"],
  "crop_details": {
    "cashew": {
      "classes": ["anthracnose", "gumosis", "healthy", "leaf_miner", "red_rust"],
      "model_loaded": true
    },
    "cassava": {
      "classes": ["bacterial_blight", "brown_spot", "green_mite", "healthy", "mosaic"],
      "model_loaded": true
    }
  },
  "total_crops": 4
}
```

## 🧪 Testing

### Running Tests

1. **Unit Tests**
```bash
cd testing
python test_cashew.py
python test_cassava.py
python test_maize.py
python test_tomato.py
```

2. **API Testing**
```bash
# Test health endpoint
curl https://iumqtt2ins.eu-west-1.awsapprunner.com/health

# Test classification endpoint
curl -X POST "https://iumqtt2ins.eu-west-1.awsapprunner.com/api/classify" \
  -F "image=@test_image.jpg" \
  -F "crop_type=cashew"
```

### Test Results

The test results are stored in `testing/test_results/` and include:
- Classification reports for each crop
- Confusion matrices (PNG files)
- Per-class accuracy visualizations

## 🏋️ Training

### Model Training

Each crop has its dedicated training script:

```bash
cd training
python train_cashew.py
python train_cassava.py
python train_maize.py
python train_tomato.py
```

### Training Configuration

- **Model**: EfficientNet-B1 with custom classifier
- **Input Size**: 240x240 pixels
- **Batch Size**: 48
- **Optimizer**: AdamW with weight decay
- **Learning Rate**: 1e-4 with ReduceLROnPlateau
- **Data Augmentation**: Resize and normalization
- **Early Stopping**: Patience of 10 epochs
- **Mixed Precision**: Enabled for faster training

### Model Architecture

```python
class EfficientNetClassifier(nn.Module):
    def __init__(self, num_classes=5, model_name='efficientnet_b1'):
        super(EfficientNetClassifier, self).__init__()
        self.backbone = timm.create_model(model_name, pretrained=True)
        
        in_features = self.backbone.classifier.in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes)
        )
```

## 🚀 Deployment

### AWS App Runner Deployment

The service is deployed using AWS App Runner with the following configuration:

1. **Source**: GitHub repository
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `python api/main.py`
4. **Port**: 5003
5. **Environment Variables**: AWS credentials and Groq API key

### Environment Variables

Required environment variables for production:
- `AWS_DEFAULT_REGION`: AWS region for S3
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `GROQ_API_KEY`: Groq API key for LLM services

## 📁 Project Structure

```
backend/
├── api/
│   ├── main.py                 # FastAPI application
│   ├── routes/
│   │   └── classification.py   # Classification endpoints
│   └── services/
│       ├── classification_service.py  # Disease classification logic
│       ├── model_service.py          # Model loading and management
│       └── llm_service.py            # AI advice generation
├── training/
│   ├── train_cashew.py         # Cashew model training
│   ├── train_cassava.py        # Cassava model training
│   ├── train_maize.py          # Maize model training
│   ├── train_tomato.py         # Tomato model training
│   └── models/                 # Trained model files
├── testing/
│   ├── test_cashew.py          # Cashew model testing
│   ├── test_cassava.py         # Cassava model testing
│   ├── test_maize.py           # Maize model testing
│   ├── test_tomato.py          # Tomato model testing
│   └── test_results/           # Test results and metrics
├── data/
│   ├── tree.json              # Dataset structure
│   └── Combined/              # Training datasets
├── requirements.txt           # Python dependencies
├── fly.toml                  # Deployment configuration
└── startup.sh                # Startup script
```

## 🔒 Security & Best Practices

- **CORS**: Configured for cross-origin requests
- **Input Validation**: File type and size validation
- **Error Handling**: Comprehensive error responses
- **Logging**: Structured logging for monitoring
- **Model Security**: Models stored securely in AWS S3

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request
