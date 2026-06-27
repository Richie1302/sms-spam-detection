import React, { useState, useEffect } from 'react';
import { Brain, Lock, User, ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError(false);

    // Intentional slight delay for authentic feel
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        setAccessGranted(true);
        setTimeout(() => onLogin(), 1400);
      } else {
        setError(true);
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="login-root">
      <div className="background-nodes"></div>

      {/* Top system bar */}
      <div className="login-sys-bar">
        <span className="sys-bar-left">
          <span className="sys-bar-dot"></span>
          SYSTEM ONLINE — SECURE CHANNEL ESTABLISHED
        </span>
        <span className="sys-bar-right">
          {time.toLocaleTimeString('en-GB', { hour12: false })} &nbsp;|&nbsp;
          {time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
        </span>
      </div>

      <div className={`login-box ${accessGranted ? 'granted' : ''}`}>

        {/* Access Granted Overlay */}
        {accessGranted && (
          <div className="access-granted-overlay">
            <ShieldCheck size={52} className="granted-icon" />
            <div className="granted-text">ACCESS GRANTED</div>
            <div className="granted-sub">Initializing secure session...</div>
          </div>
        )}

        {/* Header */}
        <div className="login-header">
          <Brain className="login-logo-icon" size={44} />
          <h1 className="login-title">NEURAL THREAT<br />INTELLIGENCE</h1>
          <div className="login-subtitle-row">
            <ShieldCheck size={11} />
            <span>SECURE SYSTEM ACCESS PORTAL</span>
          </div>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleLogin} autoComplete="off">
          <div className={`input-group ${error ? 'input-error-state' : ''}`}>
            <User size={15} className="input-icon" />
            <input
              type="text"
              id="login-username"
              placeholder="Username"
              className="login-input"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(false); }}
              autoComplete="off"
              disabled={loading || accessGranted}
            />
          </div>

          <div className={`input-group ${error ? 'input-error-state' : ''}`}>
            <Lock size={15} className="input-icon" />
            <input
              type="password"
              id="login-password"
              placeholder="Password"
              className="login-input"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              disabled={loading || accessGranted}
            />
          </div>

          {error && (
            <div className="login-error">
              <AlertTriangle size={13} />
              Authentication failed — access denied. Invalid credentials.
            </div>
          )}

          <button
            type="submit"
            id="login-submit-btn"
            className={`login-btn ${loading ? 'loading' : ''}`}
            disabled={loading || accessGranted || !username.trim() || !password.trim()}
          >
            {loading ? (
              <><span className="login-spinner"></span> AUTHENTICATING...</>
            ) : (
              <>ACCESS TERMINAL <ChevronRight size={17} /></>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <div className="security-notice">
            <Lock size={9} />
            &nbsp; UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED — ALL ATTEMPTS ARE LOGGED
          </div>
        </div>
      </div>

      {/* Bottom watermark */}
      <div className="login-watermark">NTI v1.0 — SMS THREAT INTELLIGENCE PLATFORM</div>
    </div>
  );
}
