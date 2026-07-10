from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import numpy as np

# Ensure NLTK data is available
try:
    # Check if download is needed or just attempt silently with a fallback
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    nltk.download('stopwords', quiet=True)
except Exception as e:
    print(f"Warning: NLTK downloading failed (probably offline). Using cached datasets if available. Details: {e}")

app = FastAPI(title="Neural Threat Intelligence API", description="SMS Spam Detection using MNB + SMOTE")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    model = joblib.load("spam_model.pkl")
    vectorizer = joblib.load("tfidf_vectorizer.pkl")
    print("Model and vectorizer loaded successfully.")
except Exception as e:
    print(f"Error loading models: {e}")

class MessageRequest(BaseModel):
    message: str
    threshold: float = 50.0

try:
    STOP_WORDS = set(stopwords.words('english'))
except Exception as e:
    print(f"Warning: NLTK stopwords failed to load ({e}). Using fallback list.")
    # Fallback basic list of English stopwords
    STOP_WORDS = {
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
        'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
        'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
        'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
        'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
        'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
        'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
        'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
        'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should',
        "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't",
        'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't",
        'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't",
        'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"
    }

def preprocess_text(text: str):
    """Returns cleaned text and the list of steps applied."""
    steps = []
    original = text

    # Stage 1: Lowercase
    text = text.lower()
    steps.append({"step": "Lowercasing", "detail": "All characters converted to lowercase for uniformity."})

    # Stage 2: Remove punctuation and numbers
    text = re.sub(f'[{re.escape(string.punctuation)}0-9]', ' ', text)
    steps.append({"step": "Noise Removal", "detail": "Punctuation and numeric characters stripped from the message."})

    # Stage 3: Tokenize
    try:
        tokens = word_tokenize(text)
    except Exception as e:
        print(f"Warning: NLTK tokenization failed ({e}). Using basic whitespace split fallback.")
        tokens = text.split()
    steps.append({"step": "Tokenization", "detail": f"Message split into {len(tokens)} individual tokens (words)."})

    # Stage 4: Remove stopwords
    filtered_tokens = [t for t in tokens if t not in STOP_WORDS and len(t) > 1]
    removed_count = len(tokens) - len(filtered_tokens)
    steps.append({"step": "Stopword Removal", "detail": f"{removed_count} common stopwords removed. {len(filtered_tokens)} meaningful tokens retained."})

    # Stage 5: TF-IDF Vectorization (described)
    steps.append({"step": "TF-IDF Vectorization", "detail": f"Each token weighted by Term Frequency-Inverse Document Frequency across a 5,000-feature vocabulary."})

    clean_text = ' '.join(filtered_tokens)
    return clean_text, filtered_tokens, steps

def get_top_features(vectorized_text, n=8):
    """Get the top TF-IDF-weighted tokens from the vectorized message."""
    feature_names = vectorizer.get_feature_names_out()
    tfidf_scores = vectorized_text.toarray()[0]
    top_indices = np.argsort(tfidf_scores)[::-1][:n]
    top_tokens = [
        {"token": feature_names[i], "score": round(float(tfidf_scores[i]), 4)}
        for i in top_indices if tfidf_scores[i] > 0
    ]
    return top_tokens

# In-memory session stats
session_stats = {"total_scans": 0, "spam_count": 0, "ham_count": 0}

@app.get("/")
async def root():
    return {"status": "Neural Threat Intelligence API is live", "model": "MNB + SMOTE v1.0"}

@app.post("/predict")
async def predict_spam(request: MessageRequest):
    # Preprocess
    clean_text, tokens, steps = preprocess_text(request.message)

    # Vectorize
    vectorized_text = vectorizer.transform([clean_text])

    # Predict
    probabilities = model.predict_proba(vectorized_text)[0]
    spam_prob = round(float(probabilities[1]) * 100, 2)
    ham_prob = round(float(probabilities[0]) * 100, 2)

    label = "spam" if spam_prob >= request.threshold else "ham"
    confidence = spam_prob if label == "spam" else ham_prob

    # Update session stats
    session_stats["total_scans"] += 1
    if label == "spam":
        session_stats["spam_count"] += 1
    else:
        session_stats["ham_count"] += 1

    # Get top contributing tokens
    top_features = get_top_features(vectorized_text, n=8)

    return {
        "label": label,
        "confidence": confidence,
        "message": "SPAM DETECTED" if label == "spam" else "LEGITIMATE MESSAGE",
        "spam_probability": spam_prob,
        "ham_probability": ham_prob,
        "token_count": len(tokens),
        "clean_tokens": tokens[:12],
        "top_features": top_features,
        "preprocessing_steps": steps,
        "model_used": "Multinomial Naive Bayes + SMOTE",
        "feature_space": "TF-IDF (5,000 features)",
        "threshold_used": request.threshold,
    }

@app.get("/stats")
async def get_stats():
    return session_stats

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
