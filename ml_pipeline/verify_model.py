import os
import zipfile
import urllib.request
import re
import string
import pandas as pd
import numpy as np

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, matthews_corrcoef
from imblearn.over_sampling import SMOTE

# Download NLTK data if needed
nltk.download('punkt_tab', quiet=True)
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

DATA_FILE = "data/SMSSpamCollection"

def preprocess_text(text):
    text = text.lower()
    text = re.sub(f'[{re.escape(string.punctuation)}0-9]', ' ', text)
    tokens = word_tokenize(text)
    stop_words = set(stopwords.words('english'))
    tokens = [t for t in tokens if t not in stop_words]
    return ' '.join(tokens)

def compute_metrics(y_true, y_pred):
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred)
    rec = recall_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)
    mcc = matthews_corrcoef(y_true, y_pred)
    return acc, prec, rec, f1, mcc

def main():
    if not os.path.exists(DATA_FILE):
        print("Data file not found. Please ensure data/SMSSpamCollection exists (run train_model.py first if needed).")
        return

    print("Loading data...")
    df = pd.read_csv(DATA_FILE, sep='\t', header=None, names=['label', 'message'])
    
    print("Preprocessing text...")
    df['clean_message'] = df['message'].apply(preprocess_text)
    df['label_num'] = df['label'].map({'spam': 1, 'ham': 0})
    
    X = df['clean_message']
    y = df['label_num']

    print("=" * 60)
    print("CHECK 1: OVERFITTING CHECK (TRAIN VS TEST PERFORMANCE)")
    print("=" * 60)
    
    # Check 1: Overfitting Check
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    vectorizer = TfidfVectorizer(max_features=5000, sublinear_tf=True)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train_vec, y_train)
    
    model = MultinomialNB()
    model.fit(X_train_resampled, y_train_resampled)
    
    y_train_pred = model.predict(X_train_resampled)
    train_acc, train_prec, train_rec, train_f1, train_mcc = compute_metrics(y_train_resampled, y_train_pred)
    
    y_test_pred = model.predict(X_test_vec)
    test_acc, test_prec, test_rec, test_f1, test_mcc = compute_metrics(y_test, y_test_pred)
    
    print(f"{'Metric':<15} | {'Training Set (SMOTE)':<25} | {'Test Set (Original)':<20}")
    print("-" * 65)
    print(f"{'Accuracy':<15} | {train_acc:<25.4f} | {test_acc:<20.4f}")
    print(f"{'Precision':<15} | {train_prec:<25.4f} | {test_prec:<20.4f}")
    print(f"{'Recall':<15} | {train_rec:<25.4f} | {test_rec:<20.4f}")
    print(f"{'F1-Score':<15} | {train_f1:<25.4f} | {test_f1:<20.4f}")
    
    gap = abs(train_f1 - test_f1)
    print(f"\nAnalysis: The F1-score gap between train and test is {gap:.4f}.")
    if gap > 0.10:
        print("Concern: Large gap indicates potential overfitting.")
    else:
        print("Good Generalization: The gap is small, indicating stable performance.")

    print("\n" + "=" * 60)
    print("CHECK 2: STABILITY CHECK (5-FOLD CROSS-VALIDATION)")
    print("=" * 60)
    
    kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    cv_acc, cv_prec, cv_rec, cv_f1, cv_mcc = [], [], [], [], []
    
    fold = 1
    for train_index, test_index in kf.split(X, y):
        X_tr, X_te = X.iloc[train_index], X.iloc[test_index]
        y_tr, y_te = y.iloc[train_index], y.iloc[test_index]
        
        vec = TfidfVectorizer(max_features=5000, sublinear_tf=True)
        X_tr_vec = vec.fit_transform(X_tr)
        X_te_vec = vec.transform(X_te)
        
        smt = SMOTE(random_state=42)
        X_tr_resampled, y_tr_resampled = smt.fit_resample(X_tr_vec, y_tr)
        
        clf = MultinomialNB()
        clf.fit(X_tr_resampled, y_tr_resampled)
        
        y_pred = clf.predict(X_te_vec)
        acc, prec, rec, f1, mcc = compute_metrics(y_te, y_pred)
        
        cv_acc.append(acc)
        cv_prec.append(prec)
        cv_rec.append(rec)
        cv_f1.append(f1)
        cv_mcc.append(mcc)
        fold += 1
        
    print(f"{'Metric':<15} | {'Mean across 5 Folds':<25} | {'Standard Deviation':<20}")
    print("-" * 65)
    print(f"{'Accuracy':<15} | {np.mean(cv_acc):<25.4f} | ± {np.std(cv_acc):<20.4f}")
    print(f"{'Precision':<15} | {np.mean(cv_prec):<25.4f} | ± {np.std(cv_prec):<20.4f}")
    print(f"{'Recall':<15} | {np.mean(cv_rec):<25.4f} | ± {np.std(cv_rec):<20.4f}")
    print(f"{'F1-Score':<15} | {np.mean(cv_f1):<25.4f} | ± {np.std(cv_f1):<20.4f}")
    print(f"{'MCC':<15} | {np.mean(cv_mcc):<25.4f} | ± {np.std(cv_mcc):<20.4f}")
    
    print("\nAnalysis: Low standard deviations (typically < 0.03) indicate high model stability across different data splits.")

if __name__ == "__main__":
    main()
