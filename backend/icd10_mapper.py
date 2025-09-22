#!/usr/bin/env python3
"""
ICD-10 Code Mapping Script
Converts the Jupyter notebook logic into a standalone Python script
"""

import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import json
import os
import sys
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import ast
from rapidfuzz import fuzz, process

def setup_icd10_data():
    """Step 1: Preprocess ICD-10 Metadata from .txt"""
    try:
        with open("./codes.txt", "r", encoding="utf-8") as f:
            lines = f.readlines()
    except FileNotFoundError:
        print("Error: codes.txt file not found. Please ensure it exists in the current directory.")
        return False

    entries = []
    for line in lines:
        parts = line.strip().split(None, 4)
        if len(parts) == 5:
            _, code, _, short_desc, long_desc = parts
            entries.append({
                "code": code,
                "short_description": short_desc.strip(),
                "long_description": long_desc.strip()
            })

    chunks = [f"ICD Code: {e['code']}. Description: {e['long_description']}" for e in entries]
    codes = [e['code'] for e in entries]
    descriptions = [e['long_description'] for e in entries]

    os.makedirs("icd10_kb", exist_ok=True)
    with open("icd10_kb/icd_chunks_3.json", "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2)
    with open("icd10_kb/icd_codes_3.json", "w", encoding="utf-8") as f:
        json.dump(codes, f, indent=2)
    with open("icd10_kb/icd_descriptions_3.json", "w", encoding="utf-8") as f:
        json.dump(descriptions, f, indent=2)

    print("ICD-10 metadata processed.")
    return True

def create_embedding_index():
    """Step 2: Create Embedding Index using Sentence-BERT + FAISS"""
    try:
        with open("icd10_kb/icd_chunks_3.json", "r") as f:
            chunks = json.load(f)
    except FileNotFoundError:
        print("Error: ICD chunks file not found. Run setup_icd10_data() first.")
        return False

    EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"  # Faster, smaller model
    print("Downloading Sentence-BERT model (this may take several minutes on first run)...")
    embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
    print("Model loaded successfully. Creating embeddings...")

    embeddings = embedder.encode(chunks, show_progress_bar=True)
    dim = embeddings[0].shape[0]
    index = faiss.IndexFlatL2(dim)
    index.add(np.array(embeddings))
    faiss.write_index(index, "icd10_index_3.faiss")
    print("FAISS index created.")
    return True

def map_diagnoses(diagnoses_input):
    """
    Step 3: Hybrid Keyword + Semantic Retriever Mapping

    Args:
        diagnoses_input: List of diagnosis strings or single diagnosis string

    Returns:
        List of mapping results
    """
    # Load assets
    try:
        with open("icd10_kb/icd_chunks_3.json", "r") as f:
            icd_chunks = json.load(f)
        with open("icd10_kb/icd_codes_3.json", "r") as f:
            icd_codes = json.load(f)
        with open("icd10_kb/icd_descriptions_3.json", "r") as f:
            icd_descs = json.load(f)
        index = faiss.read_index("icd10_index_3.faiss")

        # Load embedder
        EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"  # Faster, smaller model
        embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
    except Exception as e:
        print(f"Error loading assets: {e}")
        return []

    # Handle single diagnosis or list
    if isinstance(diagnoses_input, str):
        diagnoses_list = [diagnoses_input]
    else:
        diagnoses_list = diagnoses_input

    results = []

    for diag in diagnoses_list:
        try:
            # Step 1: Keyword Match
            keyword_result = process.extractOne(
                diag,
                icd_descs,
                scorer=fuzz.token_sort_ratio,
                score_cutoff=85,
                processor=None
            )

            if keyword_result:
                match, score, idx = keyword_result
                code = icd_codes[idx]
                confidence = "High" if score >= 95 else "Medium"
                justification = f"Keyword match with score {score}/100. Confidence: {confidence}. Found similar phrase in ICD description."
                alternatives = ""
            else:
                # Step 2: Semantic Search
                emb = embedder.encode([diag])
                D, I = index.search(np.array(emb), k=3)
                idx = I[0][0]
                alt = [(icd_codes[I[0][j]], icd_descs[I[0][j]], float(D[0][j])) for j in range(3)]
                code = icd_codes[idx]
                confidence = "Low" if D[0][0] > 0.8 else "Medium"
                justification = f"Semantic match using Sentence-BERT. Distance: {D[0][0]:.3f}. Confidence: {confidence}. No direct keyword match found above threshold."
                alternatives = f"{alt[1][0]} (distance: {alt[1][2]:.3f}), {alt[2][0]} (distance: {alt[2][2]:.3f})"

            results.append({
                "original_diagnosis": diag,
                "matched_icd_code": code,
                "matched_description": icd_descs[idx],
                "confidence_level": confidence,
                "justification": justification,
                "alternative_codes": alternatives
            })
        except Exception as e:
            results.append({
                "original_diagnosis": diag,
                "matched_icd_code": None,
                "matched_description": None,
                "confidence_level": "Error",
                "justification": f"Error processing diagnosis: {str(e)}",
                "alternative_codes": ""
            })

    return results

def initialize_system():
    """Initialize the ICD-10 mapping system"""
    print("Initializing ICD-10 mapping system...")

    # Check if data files exist, if not create them
    if not os.path.exists("icd10_kb/icd_codes_3.json"):
        print("Setting up ICD-10 data...")
        if not setup_icd10_data():
            return False

    # Check if FAISS index exists, if not create it
    if not os.path.exists("icd10_index_3.faiss"):
        print("Creating embedding index...")
        if not create_embedding_index():
            return False

    print("System initialized successfully!")
    return True

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print("Usage: python icd10_mapper.py \"diagnosis text\" [\"diagnosis2\"] ...")
        print("Example: python icd10_mapper.py \"acute myocardial infarction\"")
        sys.exit(1)

    # Initialize system
    if not initialize_system():
        sys.exit(1)

    # Get diagnoses from command line arguments
    diagnoses = sys.argv[1:]

    # Map diagnoses
    results = map_diagnoses(diagnoses)

    # Output results as JSON
    output = {
        "total_processed": len(diagnoses),
        "results": results
    }

    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()