import React, { useState, useEffect } from 'react';
import { 
  Database, Shield, Bell, Save,
  CheckCircle, Server, Clock, AlertCircle, Info
} from 'lucide-react';

function Toggle({ checked, onChange }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="slider round"></span>
    </label>
  );
}

export default function Settings() {
  const [autoQuarantine, setAutoQuarantine] = useState(true);
  const [auditLog, setAuditLog] = useState(true);
  const [realTimeMonitor, setRealTimeMonitor] = useState(true);
  const [dataRetention, setDataRetention] = useState(7);
  const [confThreshold, setConfThreshold] = useState(85);
  const [saved, setSaved] = useState(false);
  const [desktopNotifs, setDesktopNotifs] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  // Sync toggle with real browser permission on load
  useEffect(() => {
    if (notifPermission === 'granted') setDesktopNotifs(true);
  }, [notifPermission]);

  const handleDesktopNotifsToggle = async (val) => {
    if (!val) {
      setDesktopNotifs(false);
      return;
    }
    if (notifPermission === 'granted') {
      setDesktopNotifs(true);
      return;
    }
    if (notifPermission === 'denied') {
      alert('Browser notifications are blocked. Please allow them in your browser site settings and refresh.');
      return;
    }
    // Request permission
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === 'granted') {
      setDesktopNotifs(true);
      new Notification('Neural Threat Intelligence', {
        body: 'Desktop threat alerts are now active.',
        icon: '/favicon.ico',
      });
    } else {
      setDesktopNotifs(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const notifStatusText = () => {
    if (notifPermission === 'granted') return 'Permission granted';
    if (notifPermission === 'denied') return 'Blocked by browser';
    if (notifPermission === 'unsupported') return 'Not supported';
    return 'Click toggle to enable';
  };

  return (
    <div className="page-container">
      <div className="settings-page-header">
        <div>
          <h1 className="page-title">System Configuration</h1>
          <p className="page-subtitle">Manage the Neural Threat Intelligence engine parameters and security preferences</p>
        </div>
        <div className="system-uptime">
          <Server size={14} />
          <span>Backend: <strong className="text-cyan">ONLINE</strong></span>
          <Clock size={14} style={{marginLeft:12}} />
          <span>Uptime: <strong className="text-cyan">Active</strong></span>
        </div>
      </div>

      <div className="settings-layout">
        {/* Left Column */}
        <div className="settings-col">

          {/* Model Configuration */}
          <div className="settings-card bg-panel">
            <div className="bg-panel-header"><Database size={14} /> MODEL CONFIGURATION</div>
            <div className="settings-section-body">
              <label className="settings-label">Active Classification Engine</label>
              
              {/* SMOTE model — always active */}
              <div className="radio-group">
                <div className="radio-card active">
                  <div className="radio-content">
                    <div className="radio-title-row">
                      <span className="radio-title">Experimental (SMOTE)</span>
                      <span className="radio-badge cyan-badge">ACTIVE</span>
                    </div>
                    <span className="radio-desc">Recall: 95.30% — Maximises spam detection. Synthetic oversampling applied. Higher FPR (3.52%).</span>
                  </div>
                </div>

                {/* Baseline — reference only, not selectable for live inference */}
                <div className="radio-card radio-card-locked">
                  <div className="radio-content">
                    <div className="radio-title-row">
                      <span className="radio-title">Baseline (Standard)</span>
                      <span className="radio-badge grey-badge">REFERENCE ONLY</span>
                    </div>
                    <span className="radio-desc">Precision: 99.15% — Near-zero FPR (0.10%). Analytics comparison model. Not loaded for live inference.</span>
                  </div>
                  <div className="locked-notice">
                    <Info size={11} /> Comparison baseline — see Analytics page for benchmark data
                  </div>
                </div>
              </div>

              <div className="settings-row" style={{marginTop:16}}>
                <label className="settings-label">Loaded Model Checkpoint</label>
                <div className="model-checkpoint-display">
                  <span className="checkpoint-badge">v1.0-smote</span>
                  <span className="checkpoint-hint">MNB + SMOTE — currently deployed</span>
                </div>
              </div>

              <div className="settings-row">
                <label className="settings-label">Detection Confidence Threshold: <strong className="text-cyan">{confThreshold}%</strong></label>
                <input
                  type="range" min="50" max="99" value={confThreshold}
                  onChange={e => setConfThreshold(Number(e.target.value))}
                  className="settings-slider"
                />
                <div className="slider-ticks">
                  <span>50%</span><span>75%</span><span>99%</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="settings-col">

          {/* Security Preferences */}
          <div className="settings-card bg-panel">
            <div className="bg-panel-header"><Shield size={14} /> SECURITY PREFERENCES</div>
            <div className="settings-section-body">
              {[
                { label: 'Auto-Quarantine Threats', desc: `Block messages exceeding ${confThreshold}% confidence automatically`, val: autoQuarantine, set: setAutoQuarantine },
                { label: 'Real-Time Feed Monitoring', desc: 'Stream live SMS traffic metadata through the neural inspection engine', val: realTimeMonitor, set: setRealTimeMonitor },
                { label: 'Audit Trail Logging', desc: 'Persist all scan events to the session log for review and export', val: auditLog, set: setAuditLog },
              ].map((item, i) => (
                <div key={i} className="toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">{item.label}</span>
                    <span className="toggle-desc">{item.desc}</span>
                  </div>
                  <Toggle checked={item.val} onChange={item.set} />
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="settings-card bg-panel">
            <div className="bg-panel-header"><Bell size={14} /> NOTIFICATION SETTINGS</div>
            <div className="settings-section-body">
              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">Desktop Threat Alerts</span>
                  <span className="toggle-desc">
                    Display a browser notification when a threat is detected
                    {' '}<span className={`notif-status-tag ${notifPermission === 'granted' ? 'tag-green' : notifPermission === 'denied' ? 'tag-red' : 'tag-muted'}`}>
                      {notifStatusText()}
                    </span>
                  </span>
                </div>
                <Toggle checked={desktopNotifs} onChange={handleDesktopNotifsToggle} />
              </div>

              {notifPermission === 'denied' && (
                <div className="settings-warning">
                  <AlertCircle size={13} />
                  Notifications are blocked. Open browser site settings and allow notifications, then refresh.
                </div>
              )}

              <div className="settings-row" style={{marginTop:16}}>
                <label className="settings-label">Data Retention Policy: <strong className="text-cyan">{dataRetention} days</strong></label>
                <input
                  type="range" min="1" max="30" value={dataRetention}
                  onChange={e => setDataRetention(Number(e.target.value))}
                  className="settings-slider"
                />
                <div className="slider-ticks">
                  <span>1 day</span><span>15 days</span><span>30 days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
            {saved ? <CheckCircle size={18} /> : <Save size={18} />}
            <span>{saved ? 'CONFIGURATION SAVED' : 'SAVE CONFIGURATION'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
