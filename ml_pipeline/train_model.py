import os
import zipfile
import urllib.request
import re
import string
import pandas as pd
import numpy as np
import joblib

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, matthews_corrcoef
from imblearn.over_sampling import SMOTE

# Download NLTK data if needed
nltk.download('punkt_tab', quiet=True)
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

DATA_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip"
DATA_ZIP = "data/smsspamcollection.zip"
DATA_FILE = "data/SMSSpamCollection"

def download_data():
    if not os.path.exists("data"):
        os.makedirs("data")
    if not os.path.exists(DATA_FILE):
        print("Downloading dataset...")
        urllib.request.urlretrieve(DATA_URL, DATA_ZIP)
        with zipfile.ZipFile(DATA_ZIP, 'r') as zip_ref:
            zip_ref.extractall("data")
        print("Dataset downloaded and extracted.")

def preprocess_text(text):
    # Stage 1: Lowercase
    text = text.lower()
    # Stage 2: Remove punctuation and numbers
    text = re.sub(f'[{re.escape(string.punctuation)}0-9]', ' ', text)
    # Stage 3: Tokenize
    tokens = word_tokenize(text)
    # Stage 4: Remove stopwords
    stop_words = set(stopwords.words('english'))
    tokens = [t for t in tokens if t not in stop_words]
    # Stage 5: Rejoin
    return ' '.join(tokens)

def compute_metrics(y_true, y_pred):
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred)
    rec = recall_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)
    mcc = matthews_corrcoef(y_true, y_pred)
    cm = confusion_matrix(y_true, y_pred)
    # FPR = FP / (FP + TN)
    tn, fp, fn, tp = cm.ravel()
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    return acc, prec, rec, f1, mcc, fpr, cm

def main():
    download_data()

    print("Loading data...")
    # Read the tab-delimited file
    df = pd.read_csv(DATA_FILE, sep='\t', header=None, names=['label', 'message'])
    
    print("Preprocessing text...")
    df['clean_message'] = df['message'].apply(preprocess_text)
    
    # Encode labels: spam=1, ham=0
    df['label_num'] = df['label'].map({'spam': 1, 'ham': 0})
    
    # Train-test split (80/20 stratified)
    X = df['clean_message']
    y = df['label_num']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    print("Vectorizing text using TF-IDF...")
    vectorizer = TfidfVectorizer(max_features=5000, sublinear_tf=True)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    print("Applying SMOTE to training data...")
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train_vec, y_train)
    
    print(f"Original training class distribution: {np.bincount(y_train)}")
    print(f"SMOTE training class distribution: {np.bincount(y_train_resampled)}")
    
    # Train Baseline Model (No SMOTE)
    print("\n--- Training Baseline Model (No SMOTE) ---")
    baseline_model = MultinomialNB()
    baseline_model.fit(X_train_vec, y_train)
    y_pred_baseline = baseline_model.predict(X_test_vec)
    b_acc, b_prec, b_rec, b_f1, b_mcc, b_fpr, b_cm = compute_metrics(y_test, y_pred_baseline)
    print(f"Accuracy: {b_acc:.4f}")
    print(f"Precision: {b_prec:.4f}")
    print(f"Recall: {b_rec:.4f}")
    print(f"F1-Score: {b_f1:.4f}")
    print(f"MCC: {b_mcc:.4f}")
    print(f"FPR: {b_fpr:.4f}")
    print(f"Confusion Matrix:\n{b_cm}")
    
    # Train Experimental Model (With SMOTE)
    print("\n--- Training Experimental Model (With SMOTE) ---")
    experimental_model = MultinomialNB()
    experimental_model.fit(X_train_resampled, y_train_resampled)
    y_pred_exp = experimental_model.predict(X_test_vec)
    e_acc, e_prec, e_rec, e_f1, e_mcc, e_fpr, e_cm = compute_metrics(y_test, y_pred_exp)
    print(f"Accuracy: {e_acc:.4f}")
    print(f"Precision: {e_prec:.4f}")
    print(f"Recall: {e_rec:.4f}")
    print(f"F1-Score: {e_f1:.4f}")
    print(f"MCC: {e_mcc:.4f}")
    print(f"FPR: {e_fpr:.4f}")
    print(f"Confusion Matrix:\n{e_cm}")
    
    print("\nSerializing Experimental Model and Vectorizer...")
    joblib.dump(experimental_model, '../backend/spam_model.pkl')
    joblib.dump(vectorizer, '../backend/tfidf_vectorizer.pkl')
    print("Models saved successfully to backend folder.")

if __name__ == "__main__":
    main()
