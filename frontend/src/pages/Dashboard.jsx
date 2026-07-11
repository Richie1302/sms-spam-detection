import React, { useState, useEffect } from 'react';
import { 
  Search, CheckSquare, Square, ShieldAlert, ShieldCheck,
  Cpu, BarChart2, Tag, ListChecks, ChevronRight, Zap
} from 'lucide-react';

const TokenConstellation = ({ features, isSpam }) => {
  if (!features || features.length === 0) return null;
  
  const nodes = features.slice(0, 6);
  const color = isSpam ? '#ff3d71' : '#00e5cc'; 
  const maxScore = Math.max(...nodes.map(f => f.score));
  
  const width = 340;
  const height = 340;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 100;
  
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '24px 0 10px 0' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: '340px', height: 'auto', overflow: 'visible' }}>
        <style>
          {`
            @media (prefers-reduced-motion: no-preference) {
              .constellation-line {
                stroke-dasharray: 250;
                stroke-dashoffset: 250;
                animation: drawLine 0.6s ease-out forwards;
              }
              .constellation-node {
                opacity: 0;
                transform: scale(0.5);
                animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
              }
              .constellation-center {
                opacity: 0;
                transform: scale(0.5);
                animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
              }
            }
            @keyframes drawLine {
              to { stroke-dashoffset: 0; }
            }
            @keyframes popIn {
              to { opacity: 1; transform: scale(1); }
            }
          `}
        </style>
        
        {nodes.map((f, i) => {
          const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          const normalizedScore = maxScore > 0 ? (f.score / maxScore) * 0.7 + 0.3 : 0.5;
          const strokeWidth = 1.5 + normalizedScore * 3.5;
          
          return (
            <line 
              key={`line-${i}`}
              x1={cx} y1={cy} x2={x} y2={y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeOpacity={normalizedScore * 0.65}
              className="constellation-line"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          );
        })}
        
        <g className="constellation-center" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <circle cx={cx} cy={cy} r={34} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2.5} />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="13" fontWeight="800" letterSpacing="1.5">
            {isSpam ? 'SPAM' : 'HAM'}
          </text>
        </g>
        
        {nodes.map((f, i) => {
          const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          const normalizedScore = maxScore > 0 ? (f.score / maxScore) : 0.5;
          const nodeRadius = 14 + normalizedScore * 14;
          
          return (
            <g key={`node-${i}`} className="constellation-node" style={{ animationDelay: `${i * 0.1 + 0.2}s`, transformOrigin: `${x}px ${y}px` }}>
              <circle cx={x} cy={y} r={nodeRadius} fill={color} fillOpacity={0.15 + normalizedScore * 0.3} stroke={color} strokeWidth={1.5} />
              <text x={x} y={y + nodeRadius + 16} textAnchor="middle" fill="#e8eaf6" fontSize="11" fontWeight="700" letterSpacing="0.5">
                {f.token}
              </text>
              <text x={x} y={y + nodeRadius + 28} textAnchor="middle" fill={color} fontSize="10" fontWeight="800" opacity="0.85">
                {f.score.toFixed(4)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default function Dashboard({ addScanToHistory, scanHistory = [] }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [deepScan, setDeepScan] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ total_scans: 0, spam_count: 0, ham_count: 0 });
  const [scanMode, setScanMode] = useState('single');
  const [batchResults, setBatchResults] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiUrl}/stats`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setStats(data);
        }
      } catch (e) {
        console.error("Error fetching stats:", e);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
        topFeatures: data.top_features || [],
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

  const analyzeBatch = async () => {
    const lines = message.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;
    
    setLoading(true);
    setResult(null);
    setError(null);
    setShowResult(false);
    setBatchResults([]);
    
    const linesToProcess = lines.slice(0, 20);
    const results = [];
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const storedThreshold = parseFloat(localStorage.getItem('confThreshold'));
      const threshold = isNaN(storedThreshold) ? 50 : storedThreshold;
      
      for (let i = 0; i < linesToProcess.length; i++) {
        const line = linesToProcess[i];
        const response = await fetch(`${apiUrl}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: line, threshold }),
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const shortText = line.length > 60 ? line.substring(0, 60) + '...' : line;
        
        addScanToHistory({
          timestamp: new Date().toLocaleTimeString(),
          text: shortText,
          label: data.label,
          confidence: data.confidence,
          topFeatures: data.top_features || [],
        });
        
        results.push({
          text: shortText,
          label: data.label,
          confidence: data.confidence,
          spam_probability: data.spam_probability
        });
      }
      setBatchResults(results);
      if (results.length > 0) setShowResult(true);
    } catch (err) {
      setError('Connection failed during batch scan.');
    } finally {
      setLoading(false);
    }
  };

  const isSpam = result?.label === 'spam';

  const spamTriggersMap = {};
  (scanHistory || []).filter(s => s.label === 'spam').forEach(scan => {
    if (scan.topFeatures) {
      scan.topFeatures.forEach(f => {
        spamTriggersMap[f.token] = (spamTriggersMap[f.token] || 0) + 1;
      });
    }
  });
  const topSpamTriggers = Object.entries(spamTriggersMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="dashboard-root">

      {/* Top section: scanner + result panel side by side */}
      <div className={`dashboard-top-section ${showResult ? 'result-open' : ''}`}>

        {/* Scanner Modal */}
        <div className="scanner-modal">
          <div className="modal-top-badge">
            <Zap size={13} />
            <span>MNB + SMOTE — Active Engine</span>
          </div>
          <h1 className="modal-title">Neural Threat Intelligence</h1>

          <div className="scanner-box">
            <div className="scanner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#5a6a8a', letterSpacing: '1px' }}>SMS MESSAGE SCANNER</span>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: 600 }}>
                <div 
                  onClick={() => { setScanMode('single'); setBatchResults([]); setResult(null); setShowResult(false); }}
                  style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', backgroundColor: scanMode === 'single' ? 'rgba(0,229,204,0.15)' : 'transparent', color: scanMode === 'single' ? '#00e5cc' : '#5a6a8a', border: scanMode === 'single' ? '1px solid rgba(0,229,204,0.3)' : '1px solid transparent' }}
                >
                  Single Scan
                </div>
                <div 
                  onClick={() => { setScanMode('batch'); setBatchResults([]); setResult(null); setShowResult(false); }}
                  style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', backgroundColor: scanMode === 'batch' ? 'rgba(0,229,204,0.15)' : 'transparent', color: scanMode === 'batch' ? '#00e5cc' : '#5a6a8a', border: scanMode === 'batch' ? '1px solid rgba(0,229,204,0.3)' : '1px solid transparent' }}
                >
                  Batch Scan
                </div>
              </div>
            </div>
            <textarea
              className="sms-input"
              placeholder={scanMode === 'single' ? `Paste SMS message here for analysis...\n\nEx: Your account has been compromised. Verify immediately here: [Link]` : `Paste multiple SMS messages, one per line...`}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setShowResult(false); setResult(null); setBatchResults([]); }}
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
              onClick={scanMode === 'single' ? analyzeMessage : analyzeBatch}
              disabled={!message.trim() || loading}
            >
              <Search size={20} />
              <span>{loading ? (scanMode === 'batch' ? 'ANALYZING BATCH...' : 'ANALYZING...') : 'INITIATE SCAN'}</span>
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

        {/* Result Detail Panel — slides in after single scan */}
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
                <div className="result-verdict-sub" style={{ marginTop: '4px', opacity: 0.85, fontStyle: 'italic' }}>
                  {isSpam
                    ? `Spam probability (${result.spam_probability}%) met or exceeded your configured threshold (${result.threshold_used}%).`
                    : result.spam_probability >= 50
                    ? `Spam probability (${result.spam_probability}%) did not meet your configured threshold (${result.threshold_used}%), so this was classified as safe.`
                    : `Spam probability (${result.spam_probability}%) is below your configured threshold (${result.threshold_used}%).`
                  }
                </div>
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
                <TokenConstellation features={result.top_features} isSpam={isSpam} />
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

        {/* Batch Result Table */}
        {showResult && scanMode === 'batch' && batchResults.length > 0 && (
          <div className="result-detail-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(14, 22, 45, 0.95)', border: '1px solid rgba(0, 229, 204, 0.25)' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e8eaf6', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListChecks size={16} color="#00e5cc" />
              BATCH SCAN RESULTS
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px 12px', color: '#5a6a8a', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Message</th>
                    <th style={{ padding: '10px 12px', color: '#5a6a8a', borderBottom: '1px solid rgba(255,255,255,0.1)', width: '120px' }}>Classification</th>
                    <th style={{ padding: '10px 12px', color: '#5a6a8a', borderBottom: '1px solid rgba(255,255,255,0.1)', width: '100px' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', color: '#e8eaf6' }}>{r.text}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: r.label === 'spam' ? '#ff3d71' : '#00e5cc' }}>
                        {r.label.toUpperCase()}
                      </td>
                      <td style={{ padding: '12px', color: '#5a6a8a', fontFamily: 'monospace' }}>{r.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {message.split('\n').map(l => l.trim()).filter(l => l.length > 0).length > 20 && (
              <div style={{ fontSize: '11px', color: '#ff9800', marginTop: '16px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={12} />
                Only the first 20 messages were processed.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom section: three info panels in a row */}
      <div className="dashboard-info-row">
        <div className="bg-panel dashboard-info-panel">
          <div className="bg-panel-header">LIVE SESSION STATS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
              <span style={{ color: '#8892b0', fontSize: '13px' }}>Total Scans</span>
              <span style={{ color: '#64ffda', fontWeight: 'bold', fontSize: '16px' }}>{stats.total_scans}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
              <span style={{ color: '#8892b0', fontSize: '13px' }}>Threats (Spam)</span>
              <span style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '16px' }}>{stats.spam_count}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8892b0', fontSize: '13px' }}>Safe (Ham)</span>
              <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '16px' }}>{stats.ham_count}</span>
            </div>
          </div>
        </div>
        <div className="bg-panel dashboard-info-panel">
          <div className="bg-panel-header">RECENT SCANS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0', overflow: 'hidden' }}>
            {!scanHistory || scanHistory.length === 0 ? (
              <div style={{ color: '#8892b0', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>No scans yet</div>
            ) : (
              scanHistory.slice(0, 3).map((scan, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '10px', backgroundColor: 'rgba(2, 12, 27, 0.4)', borderRadius: '6px', borderLeft: `3px solid ${scan.label === 'spam' ? '#ff6b6b' : '#64ffda'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#8892b0', fontSize: '11px' }}>{scan.timestamp}</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: scan.label === 'spam' ? '#ff6b6b' : '#64ffda' }}>{scan.label.toUpperCase()}</span>
                  </div>
                  <span style={{ color: '#ccd6f6', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-panel dashboard-info-panel">
          <div className="bg-panel-header">TOP SPAM TRIGGERS (SESSION)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0', overflow: 'hidden' }}>
            {topSpamTriggers.length === 0 ? (
              <div style={{ color: '#8892b0', fontSize: '13px', textAlign: 'center', marginTop: '10px' }}>No spam signals detected yet this session</div>
            ) : (
              topSpamTriggers.map(([token, count], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'rgba(2, 12, 27, 0.4)', borderRadius: '4px', borderLeft: '3px solid #ff6b6b' }}>
                  <span style={{ color: '#ccd6f6', fontSize: '12px', fontWeight: 'bold' }}>{token}</span>
                  <span style={{ color: '#ff6b6b', fontSize: '12px', fontWeight: 'bold' }}>{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
