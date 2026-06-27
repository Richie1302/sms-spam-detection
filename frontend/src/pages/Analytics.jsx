import React, { useState, useEffect } from 'react';
import { Activity, BarChart2, PieChart, TrendingUp, Info, Wifi } from 'lucide-react';

function AnimatedBar({ value, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), 300 + delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return (
    <div className="anim-bar-container">
      <div
        className={`anim-bar-fill ${color}`}
        style={{ width: `${width}%`, transition: 'width 1s ease-out' }}
      ></div>
    </div>
  );
}

function MetricRow({ label, value, color, delay }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setDisplay(value), 300 + delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return (
    <div className="metric-row">
      <span className="metric-row-label">{label}</span>
      <AnimatedBar value={value} color={color} delay={delay} />
      <span className={`metric-row-val ${color}`}>{display}%</span>
    </div>
  );
}

const MATRIX_CELLS = [
  { label: 'True Negative', value: 932, type: 'tn', tooltip: 'Legitimate messages correctly identified as safe (Ham). No disruption to real users.' },
  { label: 'False Positive', value: 34, type: 'fp', tooltip: 'Legitimate messages incorrectly flagged as spam. These were innocent messages blocked.' },
  { label: 'False Negative', value: 7, type: 'fn', tooltip: 'Spam messages that slipped through undetected. The model missed these threats.' },
  { label: 'True Positive', value: 142, type: 'tp', tooltip: 'Spam messages correctly caught and blocked by the neural model. System working as intended.' },
];

export default function Analytics() {
  const [tooltip, setTooltip] = useState(null);
  const [liveStats, setLiveStats] = useState({ total_scans: 0, spam_count: 0, ham_count: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/stats');
        if (res.ok) {
          const data = await res.json();
          setLiveStats(data);
        }
      } catch (_) {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const detectionRate = liveStats.total_scans > 0
    ? Math.round((liveStats.spam_count / liveStats.total_scans) * 100)
    : 0;


  return (
    <div className="page-container">
      <div className="analytics-page-header">
        <div>
          <h1 className="page-title">Neural Model Analytics</h1>
          <p className="page-subtitle">Live performance metrics for the active Multinomial Naive Bayes + SMOTE classifier</p>
        </div>
        <div className="model-badge">
          <span className="model-badge-dot"></span>
          <span>Model: MNB + SMOTE v1.0 Active</span>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="analytics-top-cards">
        {[
          { icon: <TrendingUp size={22} />, label: 'ACCURACY', value: '96.32%', sub: 'Experimental (SMOTE)', cls: 'cyan' },
          { icon: <Activity size={22} />, label: 'RECALL', value: '95.30%', sub: 'Spam Catch Rate', cls: 'green' },
          { icon: <BarChart2 size={22} />, label: 'F1 SCORE', value: '87.38%', sub: 'Harmonic Mean', cls: 'blue' },
          { icon: <PieChart size={22} />, label: 'MCC SCORE', value: '0.8565', sub: 'Matthews Correlation', cls: 'orange' },
          { icon: <Activity size={22} />, label: 'PRECISION', value: '80.68%', sub: 'Positive Predictive Value', cls: 'purple' },
          { icon: <TrendingUp size={22} />, label: 'FALSE POS. RATE', value: '3.52%', sub: 'FPR (SMOTE Model)', cls: 'red' },
        ].map((c, i) => (
          <div key={i} className={`stat-card bg-panel stat-card-${c.cls}`}>
            <div className={`stat-card-icon ${c.cls}`}>{c.icon}</div>
            <div className="stat-card-body">
              <span className="stat-card-label">{c.label}</span>
              <span className={`stat-card-value ${c.cls}`}>{c.value}</span>
              <span className="stat-card-sub">{c.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Session Stats */}
      <div className="live-session-bar bg-panel" style={{marginBottom: 16}}>
        <div className="live-session-title"><Wifi size={13} className="live-pulse-icon" /> LIVE SESSION STATS</div>
        <div className="live-session-stats">
          <div className="live-stat-item">
            <span className="live-stat-val">{liveStats.total_scans}</span>
            <span className="live-stat-label">TOTAL SCANS</span>
          </div>
          <div className="live-stat-divider"></div>
          <div className="live-stat-item">
            <span className="live-stat-val text-red">{liveStats.spam_count}</span>
            <span className="live-stat-label">THREATS CAUGHT</span>
          </div>
          <div className="live-stat-divider"></div>
          <div className="live-stat-item">
            <span className="live-stat-val text-cyan">{liveStats.ham_count}</span>
            <span className="live-stat-label">SAFE MESSAGES</span>
          </div>
          <div className="live-stat-divider"></div>
          <div className="live-stat-item">
            <span className="live-stat-val" style={{color: detectionRate > 50 ? 'var(--accent-red)' : 'var(--accent-green)'}}>{detectionRate}%</span>
            <span className="live-stat-label">DETECTION RATE</span>
          </div>
        </div>
      </div>

      <div className="analytics-bottom-grid">
        {/* Animated Metric Bars */}
        <div className="bg-panel analytics-chart-panel">
          <div className="bg-panel-header">PERFORMANCE METRICS (SMOTE vs BASELINE)</div>
          <div className="metric-rows-container">
            <div className="metric-section-title">Experimental Model (SMOTE)</div>
            <MetricRow label="Accuracy" value={96} color="bar-cyan" delay={0} />
            <MetricRow label="Recall" value={95} color="bar-green" delay={150} />
            <MetricRow label="Precision" value={81} color="bar-blue" delay={300} />
            <MetricRow label="F1 Score" value={87} color="bar-orange" delay={450} />
            <div className="metric-section-title" style={{marginTop:16}}>Baseline Model (No SMOTE)</div>
            <MetricRow label="Accuracy" value={97} color="bar-cyan" delay={600} />
            <MetricRow label="Recall" value={78} color="bar-red" delay={750} />
            <MetricRow label="Precision" value={99} color="bar-blue" delay={900} />
            <MetricRow label="F1 Score" value={87} color="bar-orange" delay={1050} />
          </div>
        </div>

        {/* Confusion Matrix - Heatmap Style */}
        <div className="bg-panel analytics-chart-panel">
          <div className="bg-panel-header">
            CONFUSION MATRIX (TEST SET — 1,115 SAMPLES)
            <span className="info-hint"><Info size={12} /> Hover cells for explanation</span>
          </div>
          <div className="heatmap-container">
            <div className="heatmap-col-labels">
              <div></div>
              <div className="hmap-label">Predicted HAM</div>
              <div className="hmap-label">Predicted SPAM</div>
            </div>
            {[
              { rowLabel: 'Actual HAM', cells: [MATRIX_CELLS[0], MATRIX_CELLS[1]] },
              { rowLabel: 'Actual SPAM', cells: [MATRIX_CELLS[2], MATRIX_CELLS[3]] },
            ].map((row, ri) => (
              <div key={ri} className="heatmap-row">
                <div className="hmap-row-label">{row.rowLabel}</div>
                {row.cells.map((cell, ci) => (
                  <div
                    key={ci}
                    className={`hmap-cell hmap-${cell.type}`}
                    onMouseEnter={() => setTooltip(cell)}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <span className="hmap-number">{cell.value}</span>
                    <span className="hmap-cell-label">{cell.label}</span>
                    {tooltip?.type === cell.type && (
                      <div className="hmap-tooltip">{cell.tooltip}</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Dataset Distribution */}
        <div className="bg-panel analytics-chart-panel col-full">
          <div className="bg-panel-header">DATASET DISTRIBUTION — BEFORE & AFTER SMOTE</div>
          <div className="distribution-compare">
            <div className="dist-column">
              <div className="dist-col-title">Before SMOTE (Imbalanced)</div>
              <div className="dist-bar-row">
                <span className="dist-bar-label">HAM</span>
                <div className="dist-bar-track">
                  <div className="dist-bar-inner ham-bar" style={{width:'87%'}}></div>
                </div>
                <span className="dist-bar-count">4,827</span>
              </div>
              <div className="dist-bar-row">
                <span className="dist-bar-label">SPAM</span>
                <div className="dist-bar-track">
                  <div className="dist-bar-inner spam-bar" style={{width:'13%'}}></div>
                </div>
                <span className="dist-bar-count">747</span>
              </div>
              <div className="dist-note red-note">⚠ Severe class imbalance — model biased towards Ham predictions.</div>
            </div>
            <div className="dist-divider"></div>
            <div className="dist-column">
              <div className="dist-col-title">After SMOTE (Balanced Training Set)</div>
              <div className="dist-bar-row">
                <span className="dist-bar-label">HAM</span>
                <div className="dist-bar-track">
                  <div className="dist-bar-inner ham-bar" style={{width:'50%'}}></div>
                </div>
                <span className="dist-bar-count">3,859</span>
              </div>
              <div className="dist-bar-row">
                <span className="dist-bar-label">SPAM</span>
                <div className="dist-bar-track">
                  <div className="dist-bar-inner spam-bar" style={{width:'50%'}}></div>
                </div>
                <span className="dist-bar-count">3,859</span>
              </div>
              <div className="dist-note green-note">✓ Perfectly balanced — 3,261 synthetic SMOTE samples generated.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
