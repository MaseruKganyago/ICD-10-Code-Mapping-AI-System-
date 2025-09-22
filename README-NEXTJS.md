# ICD-10 Code Mapping System

A full-stack application for mapping medical diagnoses to ICD-10 codes using AI-powered hybrid keyword and semantic search.

## 🏗️ Architecture

- **Backend**: Node.js/Express API with Python ML integration
- **Frontend**: Next.js with React, TypeScript, and Ant Design
- **AI/ML**: Python with Sentence-BERT, FAISS, and RapidFuzz
- **Features**: Real-time progress monitoring, background initialization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- Git

### 1. Clone and Setup Backend
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
npm install

# Start the API server
npm start
```
*API will run on `http://localhost:3000`*

### 2. Setup Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
*Frontend will run on `http://localhost:3001`*

## 🖥️ User Interface

### Dashboard Features
- **🔧 Initialization Monitor**: Real-time progress tracking with visual indicators
- **💊 Diagnosis Mapper**: Single and batch diagnosis mapping
- **📊 Progress Analytics**: Live statistics and duration tracking
- **🔍 Search Functionality**: Advanced ICD-10 code search

### Components Built with Ant Design
- Modern, responsive UI components
- Real-time progress bars and status indicators
- Professional medical application styling
- TypeScript for type safety

## 🤖 AI/ML Pipeline

### Hybrid Search Algorithm
1. **Keyword Matching**: RapidFuzz token-based similarity
2. **Semantic Search**: Sentence-BERT embeddings with FAISS indexing
3. **Confidence Scoring**: Multi-level accuracy assessment

### Models Used
- **Sentence-BERT**: `pritamdeka/S-PubMedBert-MS-MARCO`
- **Vector Search**: FAISS (Facebook AI Similarity Search)
- **Fuzzy Matching**: RapidFuzz for keyword similarity

## 📡 API Endpoints

### Initialization
```bash
POST /api/initialize          # Start background initialization
GET  /api/initialize/status   # Check progress (polling endpoint)
```

### Diagnosis Mapping
```bash
POST /api/map                 # Single diagnosis mapping
POST /api/map/batch           # Batch processing (up to 100)
GET  /api/search?q=query      # Search ICD-10 codes
GET  /api/codes               # Browse all codes (paginated)
```

### Example Request/Response
```bash
# Single diagnosis mapping
curl -X POST http://localhost:3000/api/map \
  -H "Content-Type: application/json" \
  -d '{"diagnosis": "diabetes mellitus"}'
```

```json
{
  "original_diagnosis": "diabetes mellitus",
  "matched_icd_code": "E11.9",
  "matched_description": "Type 2 diabetes mellitus without complications",
  "confidence_level": "High",
  "justification": "Keyword match with score 95/100..."
}
```

## 🎯 Key Features

### Background Processing
- **Asynchronous Initialization**: No blocking requests
- **Real-time Progress**: Live updates via polling
- **Error Handling**: Comprehensive failure recovery

### Medical AI Integration
- **Clinical NLP**: Medical domain-specific embeddings
- **Multi-modal Search**: Combines keyword + semantic approaches
- **Confidence Metrics**: Transparent accuracy assessment

### Production Ready
- **TypeScript**: Full type safety
- **Error Boundaries**: Graceful error handling
- **CORS**: Configured for cross-origin requests
- **Security**: Helmet.js security headers

## 📊 Confidence Levels

- **High (90%+)**: Direct keyword matches, clinically accurate
- **Medium (70-89%)**: Good semantic similarity, review recommended
- **Low (<70%)**: Weak matches, manual verification required
- **No Match**: No suitable ICD-10 code found

## 🔧 Development

### Project Structure
```
├── server.js              # Express API server
├── icd10_mapper.py        # Python ML pipeline
├── requirements.txt       # Python dependencies
├── package.json           # Node.js dependencies
├── frontend/              # Next.js React app
│   ├── src/
│   │   ├── app/          # Next.js 13+ app directory
│   │   ├── components/   # React components
│   │   └── types/        # TypeScript definitions
│   └── package.json      # Frontend dependencies
```

### Technology Stack
- **Backend**: Node.js, Express, Python
- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Library**: Ant Design 5.x
- **ML/AI**: Sentence-BERT, FAISS, RapidFuzz
- **Data**: ICD-10 official code dataset

## 📋 System Requirements

### Initialization Process
1. **Data Loading**: Process ICD-10 codes from `codes.txt`
2. **Model Download**: Sentence-BERT model (~400MB)
3. **Index Creation**: FAISS vector embeddings (~5-15 minutes)
4. **Validation**: System readiness verification

### Resource Usage
- **Memory**: ~2GB RAM during initialization
- **Storage**: ~1GB for models and indexes
- **Network**: Initial model download required

## 🛠️ Usage Instructions

### Step 1: Start the Backend
```bash
# From project root
npm start
```

### Step 2: Start the Frontend
```bash
# In a new terminal
cd frontend
npm run dev
```

### Step 3: Initialize the System
1. Visit: `http://localhost:3001`
2. Click "Start Initialization"
3. Monitor real-time progress (5-15 minutes)
4. Wait for "Completed" status

### Step 4: Use the Application
1. Navigate to "Diagnosis Mapper" tab
2. Enter medical diagnoses
3. Get instant ICD-10 code mappings
4. Review confidence levels and alternatives

## 🔧 Troubleshooting

### Common Issues

**"Python was not found"**
- Install Python 3.8+ or use `py` command on Windows

**CSP/CORS Errors**
- Frontend and backend must run on different ports
- Check CORS configuration in `server.js`

**Initialization Timeout**
- First run downloads ~400MB model
- Ensure stable internet connection
- Allow 10-15 minutes for completion

**Frontend Build Errors**
```bash
# Clear Next.js cache
rm -rf frontend/.next
cd frontend && npm run build
```

## 🚀 Production Deployment

### Environment Setup
```bash
# Backend (API)
export PORT=3000
export NODE_ENV=production

# Frontend
export NEXT_PUBLIC_API_URL=https://your-api.com
```

### Docker Deployment
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production

  frontend:
    build: ./frontend
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3000
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation