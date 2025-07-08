# ICD-10 Medical Diagnosis Mapping System

## 🏥 Overview

This project implements an intelligent **hybrid ICD-10 diagnosis mapping system** that automatically maps natural language medical diagnoses to standardized ICD-10 codes. The system combines keyword-based fuzzy matching with advanced semantic search using Sentence-BERT embeddings to achieve high accuracy in medical code assignment.

## 🎯 Key Features

- **Hybrid Retrieval Approach**: Combines keyword matching and semantic search for optimal accuracy
- **Medical Domain Optimization**: Uses specialized PubMed-trained Sentence-BERT model (`pritamdeka/S-PubMedBert-MS-MARCO`)
- **Confidence Scoring**: Provides High/Medium/Low confidence levels with detailed justifications
- **Alternative Suggestions**: Offers alternative ICD-10 codes when primary match confidence is low
- **Comprehensive Reporting**: Generates detailed mapping results with performance statistics
- **Efficient Vector Search**: Uses FAISS for fast similarity search across 94,000+ ICD-10 codes

## 📁 Project Structure

```
omics_naveen/
├── omicbank_3.ipynb              # Main Jupyter notebook with complete pipeline
├── codes.txt                     # Raw ICD-10 codes database (94K+ entries)
├── Diagnoses_list.xlsx          # Input file with patient diagnoses
├── final_icd10_mapped_output_3.xlsx  # Output file with mapped results
├── icd10_index_3.faiss          # FAISS vector index for semantic search
├── requirements.txt             # Python dependencies
├── icd10_kb/                    # Knowledge base directory
│   ├── icd_chunks_3.json       # Formatted ICD-10 text chunks
│   ├── icd_codes_3.json        # ICD-10 codes list
│   └── icd_descriptions_3.json # ICD-10 descriptions list
└── README.md                    # This file
```

## 🛠️ Technical Architecture

### 1. Data Preprocessing

- Parses raw ICD-10 codes from `codes.txt`
- Extracts and structures code, short description, and long description
- Creates searchable text chunks optimized for embedding

### 2. Embedding & Indexing

- **Model**: `pritamdeka/S-PubMedBert-MS-MARCO` (Medical domain-specific)
- **Vector Database**: FAISS IndexFlatL2 for L2 distance similarity search
- **Dimensionality**: 768-dimensional embeddings

### 3. Hybrid Mapping Algorithm

#### Step 1: Keyword Matching

- Uses `rapidfuzz` for fuzzy string matching
- **Scorer**: `token_sort_ratio` for flexible word order matching
- **Threshold**: 85% similarity cutoff
- **High Confidence**: Score ≥ 95%
- **Medium Confidence**: Score 85-94%

#### Step 2: Semantic Search (Fallback)

- Triggered when keyword matching fails
- Retrieves top 3 most similar ICD-10 codes
- **Medium Confidence**: Distance < 0.8
- **Low Confidence**: Distance ≥ 0.8

## 📊 Output Format

The system generates an Excel file with the following columns:

| Column                | Description                                       |
| --------------------- | ------------------------------------------------- |
| `row_id`              | Original row identifier from input                |
| `original_diagnosis`  | Raw diagnosis text                                |
| `matched_icd_code`    | Best matching ICD-10 code                         |
| `matched_description` | Full description of matched code                  |
| `confidence_level`    | High/Medium/Low confidence rating                 |
| `justification`       | Detailed explanation of matching method and score |
| `alternative_codes`   | Alternative ICD-10 codes with similarity scores   |

## 🚀 Getting Started

### Prerequisites

Install the required dependencies using pip:

```bash
pip install -r requirements.txt
```

Or install manually:

```bash
pip install pandas numpy faiss-cpu sentence-transformers rapidfuzz openpyxl jupyter
```

**Note**: For GPU acceleration, you can replace `faiss-cpu` with `faiss-gpu` in the requirements.txt file.

### Installation

1. **Clone or download the project**

   ```bash
   git clone <repository-url>
   cd omics_naveen
   ```

2. **Prepare your data**

   - Ensure `codes.txt` contains the complete ICD-10 database
   - Place your diagnoses in `Diagnoses_list.xlsx` with a column named `Diagnoses_list`
   - Each cell should contain a Python list of diagnosis strings

3. **Run the pipeline**
   ```bash
   jupyter notebook omicbank_3.ipynb
   ```
   Or run all cells in the notebook

### Input Data Format

Your `Diagnoses_list.xlsx` should have a column named `Diagnoses_list` with entries like:

```
['Type 2 diabetes mellitus', 'Hypertension', 'Chronic kidney disease']
['Pneumonia', 'Acute respiratory failure']
['Depression', 'Anxiety disorder']
```

## 📈 Performance Metrics

The system provides comprehensive statistics:

- **Total Diagnoses Mapped**: Complete count of processed diagnoses
- **High Confidence Matches**: Direct keyword matches (score ≥ 95%)
- **Medium Confidence Matches**: Good keyword matches (85-94%) or close semantic matches
- **Low Confidence Matches**: Semantic matches with higher uncertainty

### Example Output

```
✅ ICD-10 mapping with hybrid retrieval complete!
📊 SUMMARY REPORT:
   Total diagnoses mapped: 1,247
   High confidence matches: 823 (66.0%)
   Medium confidence matches: 312 (25.0%)
   Low confidence matches: 112 (9.0%)
📁 File saved → final_icd10_mapped_output_3.xlsx
```

## 🔬 Technical Details

### Embedding Model Selection

- **Model**: `pritamdeka/S-PubMedBert-MS-MARCO`
- **Rationale**: Specifically trained on PubMed medical literature
- **Architecture**: BERT-based with 768-dimensional output
- **Performance**: Optimized for medical terminology and concepts

### Similarity Metrics

- **Keyword Matching**: Token sort ratio (handles word order variations)
- **Semantic Search**: L2 (Euclidean) distance in embedding space
- **Thresholds**: Empirically tuned for medical diagnosis accuracy

### Scalability

- **Index Size**: Handles 94,000+ ICD-10 codes efficiently
- **Memory Usage**: ~750MB for full embedding index
- **Search Speed**: Sub-second retrieval for typical queries

## 🎛️ Configuration Options

### Adjustable Parameters

```python
# Keyword matching threshold
score_cutoff = 85  # Minimum similarity for keyword match

# Confidence thresholds
high_confidence_threshold = 95    # For keyword matches
semantic_confidence_threshold = 0.8  # For semantic distance

# Retrieval settings
k = 3  # Number of semantic alternatives to retrieve
```

### Model Alternatives

You can experiment with different embedding models:

```python
# Alternative models to try
EMBEDDING_MODELS = [
    "pritamdeka/S-PubMedBert-MS-MARCO",  # Current (medical-specific)
    "sentence-transformers/all-MiniLM-L6-v2",  # General purpose
    "sentence-transformers/all-mpnet-base-v2",  # Higher accuracy
    "emilyalsentzer/Bio_ClinicalBERT"  # Clinical text focused
]
```

## 📋 Use Cases

### Primary Applications

- **Electronic Health Records (EHR)**: Automated ICD-10 coding for billing
- **Medical Research**: Standardizing diagnosis data for analysis
- **Clinical Decision Support**: Suggesting appropriate ICD-10 codes
- **Healthcare Analytics**: Converting free-text diagnoses to structured codes

### Healthcare Settings

- Hospitals and clinic management systems
- Medical coding departments
- Research institutions analyzing patient data
- Healthcare data standardization projects
