import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldAlert, CheckCircle, XCircle, 
  Pause, Play, Trash2, Download, Filter, 
  Wifi, Globe, AlertTriangle, Shield
} from 'lucide-react';

const GEO_LOCATIONS = ['[RU]', '[CN]', '[NG]', '[US]', '[BR]', '[KP]', '[IN]', '[DE]', '[UA]', '[IR]'];
const PROTOCOLS = ['TCP/80', 'TCP/443', 'SMPP/2775', 'UDP/53', 'HTTP/8080', 'HTTPS/8443', 'GSM/SMS'];
const THREAT_VECTORS = [
  'Phishing URL Detected',
  'Smishing Payload Intercepted',
  'Suspicious Keyword Cluster',
  'Bulk SMS Pattern',
  'Spoofed Sender ID',
  'Malicious Redirect Chain',
  'OTP Harvesting Attempt',
  'Prize Scam Template',
  'Neural Clearance Passed',
  'Routine Traffic Scanned',
];
const STATUSES = ['BLOCKED', 'BLOCKED', 'ALLOWED', 'FLAGGED', 'ALLOWED', 'BLOCKED', 'ALLOWED'];
const DUMMY_IPS = () => `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;

export default function ThreatFeeds({ scanHistory, setScanHistory }) {
  const [liveTraffic, setLiveTraffic] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState('all');
  const terminalRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
        const newLog = {
          id: Math.random().toString(36).substr(2, 9),
          time: new Date().toLocaleTimeString(),
          ip: `${DUMMY_IPS()} ${GEO_LOCATIONS[Math.floor(Math.random() * GEO_LOCATIONS.length)]}`,
          protocol: PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)],
          vector: THREAT_VECTORS[Math.floor(Math.random() * THREAT_VECTORS.length)],
          status,
        };
        setLiveTraffic(prev => {
          const updated = [newLog, ...prev];
          if (updated.length > 12) updated.pop();
          return updated;
        });
      }, 1200);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPaused]);

  // Auto-scroll terminal to top
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = 0;
    }
  }, [liveTraffic]);

  const filteredHistory = scanHistory.filter(s => {
    if (filter === 'spam') return s.label === 'spam';
    if (filter === 'ham') return s.label === 'ham';
    return true;
  });

  const handleExportCSV = () => {
    if (scanHistory.length === 0) return;
    const headers = ['Timestamp', 'Message Snippet', 'Classification', 'Confidence (%)'];
    const rows = scanHistory.map(s => [
      s.timestamp,
      `"${s.text.replace(/"/g, '""')}"`,
      s.label.toUpperCase(),
      s.confidence,
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat_scan_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = (status) => {
    if (status === 'BLOCKED') return 'term-blocked';
    if (status === 'FLAGGED') return 'term-flagged';
    return 'term-allowed';
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="feeds-page-header">
        <div>
          <h1 className="page-title">Live Threat Feeds</h1>
          <p className="page-subtitle">Real-time SMS vector monitoring and neural network routing intelligence</p>
        </div>
        <div className="feeds-header-stats">
          <div className="hstat-card">
            <Wifi size={16} className="hstat-icon cyan" />
            <div>
              <span className="hstat-val">{liveTraffic.length}</span>
              <span className="hstat-label">Live Packets</span>
            </div>
          </div>
          <div className="hstat-card">
            <AlertTriangle size={16} className="hstat-icon red" />
            <div>
              <span className="hstat-val">{scanHistory.filter(s => s.label === 'spam').length}</span>
              <span className="hstat-label">Threats Caught</span>
            </div>
          </div>
          <div className="hstat-card">
            <Shield size={16} className="hstat-icon cyan" />
            <div>
              <span className="hstat-val">{scanHistory.filter(s => s.label === 'ham').length}</span>
              <span className="hstat-label">Safe Messages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Traffic Terminal */}
      <div className="bg-panel feeds-terminal-panel">
        <div className="bg-panel-header flex-header">
          <span><Globe size={14} style={{display:'inline',marginRight:6}} />NETWORK TRAFFIC MONITOR (LIVE)</span>
          <div className="terminal-controls">
            <span className={`live-indicator ${isPaused ? 'paused' : ''}`}>
              {isPaused ? '⏸ PAUSED' : '● LIVE'}
            </span>
            <button
              className={`term-ctrl-btn ${isPaused ? 'btn-play' : 'btn-pause'}`}
              onClick={() => setIsPaused(p => !p)}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>
        <div className="terminal-window" ref={terminalRef}>
          <div className="term-header-row">
            <span>TIME</span>
            <span>SOURCE IP / GEO</span>
            <span>PROTOCOL</span>
            <span>VECTOR ANALYSIS</span>
            <span>STATUS</span>
          </div>
          {liveTraffic.map(log => (
            <div key={log.id} className={`terminal-line rich-line ${statusColor(log.status)}`}>
              <span className="term-time">{log.time}</span>
              <span className="term-ip">{log.ip}</span>
              <span className="term-proto">{log.protocol}</span>
              <span className="term-vector">{log.vector}</span>
              <span className={`term-status-badge ${statusColor(log.status)}`}>{log.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scan History Panel */}
      <div className="bg-panel feeds-history-panel">
        <div className="bg-panel-header flex-header">
          <span><ShieldAlert size={14} style={{display:'inline',marginRight:6}} />SESSION SCAN LOG</span>
          <div className="history-controls">
            <div className="filter-group">
              <Filter size={13} />
              {['all','spam','ham'].map(f => (
                <button
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'spam' ? 'Threats' : 'Safe'}
                </button>
              ))}
            </div>
            <button className="action-btn export-btn" onClick={handleExportCSV} disabled={scanHistory.length === 0}>
              <Download size={14} /> Export CSV
            </button>
            <button className="action-btn clear-btn" onClick={() => setScanHistory([])} disabled={scanHistory.length === 0}>
              <Trash2 size={14} /> Clear Logs
            </button>
          </div>
        </div>

        <div className="history-table-container">
          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <ShieldAlert size={48} className="empty-icon" />
              <p>{scanHistory.length === 0 ? 'No messages scanned yet.' : 'No results match the current filter.'}</p>
              <p className="empty-sub">Go to Dashboard and scan an SMS message to populate this log.</p>
            </div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Timestamp</th>
                  <th>Message Snippet</th>
                  <th>Classification</th>
                  <th>Confidence</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((scan, idx) => (
                  <tr key={idx} className={`history-row ${scan.label === 'spam' ? 'row-spam' : 'row-ham'}`}>
                    <td className="td-num">{filteredHistory.length - idx}</td>
                    <td>{scan.timestamp}</td>
                    <td className="snippet-cell" title={scan.text}>{scan.text}</td>
                    <td>
                      {scan.label === 'spam' ? (
                        <span className="badge-spam"><XCircle size={12} /> THREAT</span>
                      ) : (
                        <span className="badge-ham"><CheckCircle size={12} /> SAFE</span>
                      )}
                    </td>
                    <td>
                      <div className="confidence-bar-wrapper">
                        <div
                          className={`confidence-bar-fill ${scan.label === 'spam' ? 'conf-spam' : 'conf-ham'}`}
                          style={{ width: `${scan.confidence}%` }}
                        ></div>
                        <span className="confidence-val">{scan.confidence}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`risk-badge ${scan.label === 'spam' ? 'risk-high' : 'risk-low'}`}>
                        {scan.label === 'spam' ? 'HIGH' : 'LOW'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
