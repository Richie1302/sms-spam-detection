import React, { useState } from 'react';
import { 
  Search, CheckSquare, Square, ShieldAlert, ShieldCheck,
  Cpu, BarChart2, Tag, ListChecks, ChevronRight, Zap
} from 'lucide-react';

export default function Dashboard({ addScanToHistory }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [deepScan, setDeepScan] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const analyzeMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setShowResult(false);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const storedThreshold = parseFloat(localStorage.getItem('confThreshold'));
      const threshold = isNaN(storedThreshold) ? 50 : storedThreshold;
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, threshold }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      setResult(data);
      setShowResult(true);

      addScanToHistory({
        timestamp: new Date().toLocaleTimeString(),
        text: message.length > 60 ? message.substring(0, 60) + '...' : message,
        label: data.label,
        confidence: data.confidence,
      });

      // Fire browser notification if spam detected and permission granted
      if (data.label === 'spam' && Notification.permission === 'granted') {
        new Notification('⚠ Threat Detected — Neural Threat Intelligence', {
          body: `Spam detected with ${data.confidence}% confidence. Message flagged.`,
          icon: '/favicon.ico',
        });
      }

    } catch (err) {
      setError('Connection failed. Make sure the backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const isSpam = result?.label === 'spam';

  return (
    <div className="dashboard-root">
      {/* Background blurred elements */}
      <div className={`dashboard-bg-elements ${showResult ? 'dimmed' : ''}`}>
        <div className="bg-panel feed-panel">
          <div className="bg-panel-header">THREAT FEEDS</div>
          {['Monitoring SMS vectors...', 'Neural nodes active...', 'Pattern engine scanning...', 'Intercepting traffic...'].map((t, i) => (
            <div key={i} className="blur-text">{t}</div>
          ))}
        </div>
        <div className="bg-panel map-panel">
          <div className="bg-panel-header">GLOBAL THREATS</div>
          <div className="map-placeholder"></div>
        </div>
        <div className="bg-panel stats-panel">
          <div className="bg-panel-header">Detected Threats</div>
          <div className="stats-placeholder"><div className="red-dot"></div></div>
        </div>
      </div>

      {/* Main scanner area — shifts to show result panel */}
      <div className={`dashboard-center ${showResult ? 'result-open' : ''}`}>

        {/* Scanner Modal */}
        <div className="scanner-modal">
          <div className="modal-top-badge">
            <Zap size={13} />
            <span>MNB + SMOTE — Active Engine</span>
          </div>
          <h1 className="modal-title">Neural Threat Intelligence</h1>

          <div className="scanner-box">
            <div className="scanner-header">SMS MESSAGE SCANNER</div>
            <textarea
              className="sms-input"
              placeholder={`Paste SMS message here for analysis...\n\nEx: Your account has been compromised. Verify immediately here: [Link]`}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setShowResult(false); setResult(null); }}
              disabled={loading}
            />
            {error && (
              <div className="result-overlay is-error">
                <strong>⚠️ {error}</strong>
              </div>
            )}
          </div>

          <div className="scanner-controls">
            <button
              className={`initiate-btn ${loading ? 'loading' : ''}`}
              onClick={analyzeMessage}
              disabled={!message.trim() || loading}
            >
              <Search size={20} />
              <span>{loading ? 'ANALYZING...' : 'INITIATE SCAN'}</span>
            </button>
            <div className="scan-options">
              <div className="checkbox-item">
                <CheckSquare size={18} className="checked-icon" />
                <span style={{opacity:0.6}}>Quick Scan</span>
              </div>
              <div className="checkbox-item" onClick={() => setDeepScan(!deepScan)}>
                {deepScan ? <CheckSquare size={18} className="checked-icon" /> : <Square size={18} className="unchecked-icon" />}
                <span>Deep Analysis</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <div className="footer-stat">
              <span className="stat-label">Dataset</span>
              <span className="stat-value">5,574 SMS</span>
            </div>
            <div className="footer-stat">
              <span className="stat-label">Engine</span>
              <span className="stat-value">MNB v1.0</span>
            </div>
            <div className="footer-stat">
              <span className="stat-label">Accuracy</span>
              <span className="stat-value">96.32%</span>
            </div>
          </div>
        </div>

        {/* Result Detail Panel — slides in after scan */}
        {showResult && result && (
          <div className={`result-detail-panel ${isSpam ? 'panel-spam' : 'panel-ham'}`}>
            
            {/* Result Header */}
            <div className={`result-header ${isSpam ? 'header-spam' : 'header-ham'}`}>
              <div className="result-icon-wrap">
                {isSpam
                  ? <ShieldAlert size={36} className="result-main-icon spam-icon" />
                  : <ShieldCheck size={36} className="result-main-icon ham-icon" />
                }
              </div>
              <div className="result-verdict">
                <span className="result-verdict-label">{isSpam ? 'THREAT DETECTED' : 'SAFE MESSAGE'}</span>
                <span className="result-verdict-sub">
                  {isSpam
                    ? 'This message exhibits characteristics consistent with spam/phishing.'
                    : 'No threat signatures detected. Message appears legitimate.'}
                </span>
              </div>
            </div>

            {/* Probability Bar */}
            <div className="result-section">
              <div className="result-section-title"><BarChart2 size={13} /> CONFIDENCE ANALYSIS</div>
              <div className="prob-row">
                <span className="prob-label spam-label">SPAM</span>
                <div className="prob-track">
                  <div className="prob-fill spam-fill" style={{ width: `${result.spam_probability}%` }}></div>
                  <span className="prob-inside">{result.spam_probability}%</span>
                </div>
              </div>
              <div className="prob-row">
                <span className="prob-label ham-label">HAM</span>
                <div className="prob-track">
                  <div className="prob-fill ham-fill" style={{ width: `${result.ham_probability}%` }}></div>
                  <span className="prob-inside">{result.ham_probability}%</span>
                </div>
              </div>
            </div>

            {/* Top TF-IDF Features */}
            {result.top_features?.length > 0 && (
              <div className="result-section">
                <div className="result-section-title"><Tag size={13} /> KEY SIGNAL TOKENS (TF-IDF WEIGHTED)</div>
                <div className="token-cloud">
                  {result.top_features.map((f, i) => (
                    <span key={i} className={`token-chip ${isSpam ? 'chip-spam' : 'chip-ham'}`}>
                      {f.token}
                      <span className="chip-score">{f.score}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preprocessing Steps */}
            <div className="result-section">
              <div className="result-section-title"><ListChecks size={13} /> PREPROCESSING PIPELINE</div>
              <div className="steps-list">
                {result.preprocessing_steps?.map((s, i) => (
                  <div key={i} className="step-row">
                    <span className="step-num">{i + 1}</span>
                    <div className="step-body">
                      <span className="step-name">{s.step}</span>
                      <span className="step-detail">{s.detail}</span>
                    </div>
                    <ChevronRight size={12} className="step-arrow" />
                  </div>
                ))}
              </div>
            </div>

            {/* Model Info */}
            <div className="result-section">
              <div className="result-section-title"><Cpu size={13} /> MODEL METADATA</div>
              <div className="meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Classifier</span>
                  <span className="meta-val">{result.model_used}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Feature Space</span>
                  <span className="meta-val">{result.feature_space}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Tokens Analyzed</span>
                  <span className="meta-val">{result.token_count}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Final Verdict</span>
                  <span className={`meta-val ${isSpam ? 'text-red' : 'text-cyan'}`}>{result.label.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Deep Analysis — only shown when Deep Scan is enabled */}
            {deepScan && result.clean_tokens?.length > 0 && (
              <div className="result-section">
                <div className="result-section-title"><Zap size={13} /> DEEP ANALYSIS — CLEANED TOKEN STREAM</div>
                <div className="token-cloud">
                  {result.clean_tokens.map((t, i) => (
                    <span key={i} className={`token-chip ${isSpam ? 'chip-spam' : 'chip-ham'}`}>{t}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
