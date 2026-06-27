# Neural Threat Intelligence: SMS Spam Detection System

**GitHub Repository:** [https://github.com/Richie1302/sms-spam-detection](https://github.com/Richie1302/sms-spam-detection)

## 1. Project Overview
The Neural Threat Intelligence Platform is a full-stack, machine learning-powered web application designed to automatically detect and flag malicious Short Message Service (SMS) communications, particularly smishing (SMS phishing) attacks, in real-time. 

The system utilizes a **Multinomial Naive Bayes (MNB)** classifier enhanced with **Term Frequency-Inverse Document Frequency (TF-IDF)** feature extraction. To address the inherent class imbalance in cybersecurity datasets, the model leverages the **Synthetic Minority Over-sampling Technique (SMOTE)** to achieve a 95.30% recall rate with a minimal False Positive Rate (3.52%).

## 2. Technical Stack
- **Machine Learning Layer:** Python, Scikit-Learn, Imbalanced-Learn (SMOTE), NLTK (Natural Language Toolkit), Pandas, NumPy, Joblib
- **Backend API Layer:** Python, FastAPI, Uvicorn
- **Frontend Layer:** React.js, Vite, Tailwind CSS (Custom Styling)

## 3. System Architecture
The application is built on a decoupled three-tier architecture:
1. **Model Pipeline:** `ml_pipeline/train_model.py` handles data ingestion from the UCI SMS Spam Collection, applies a 5-stage NLP text cleaning pipeline, vectorizes the text, applies SMOTE balancing, trains the MNB model, and serializes the optimal model (`spam_model.pkl`) and vectorizer (`tfidf_vectorizer.pkl`) to disk.
2. **FastAPI Backend:** The API server (`backend/main.py`) loads the serialized artifacts into memory on startup. It exposes a RESTful POST endpoint (`/predict`) that receives raw SMS strings, applies the exact same preprocessing logic, and returns a JSON payload containing the probability distribution, key threat tokens, and preprocessing logs.
3. **React Frontend:** An interactive, dark-themed dashboard provides a secure login portal, a message scanner interface, a live threat feeds monitor, and a real-time analytics dashboard for data visualization.

## 4. Setup and Installation Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+ (and npm)
- Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/Richie1302/sms-spam-detection.git
cd sms-spam-detection
```

### Step 2: Setup the Backend
Navigate to the backend directory, install Python dependencies, and run the FastAPI server.
```bash
# Create a virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate

# Install required Python packages
pip install fastapi uvicorn scikit-learn nltk pandas numpy joblib imbalanced-learn

# Run the FastAPI server
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend API will be available at: http://127.0.0.1:8000*

### Step 3: Setup the Frontend
Open a new terminal window, navigate to the frontend root, install Node dependencies, and start the Vite development server.
```bash
# Install Node dependencies
npm install

# Start the React frontend
npm run dev
```
*The web interface will be accessible at: http://localhost:5173*

## 5. Usage Guide
1. Open the frontend URL in a browser.
2. Log in using administrator credentials.
3. Navigate to the **Dashboard**.
4. Paste any SMS message into the scanner and click **INITIATE SCAN**.
5. The system will instantly flag the message as a **THREAT DETECTED** (Spam) or **SAFE MESSAGE** (Ham) and provide a detailed confidence breakdown and token analysis.

---
*Developed for Academic Project Defense Submission - 2026*
