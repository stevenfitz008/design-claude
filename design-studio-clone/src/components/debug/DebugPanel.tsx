import React, { useState, useEffect } from 'react';
import { errorLogger } from '../../utils/errorLogger';

export function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [errors, setErrors] = useState(errorLogger.getErrors());
  const [summary, setSummary] = useState(errorLogger.getErrorSummary());

  useEffect(() => {
    const interval = setInterval(() => {
      setErrors(errorLogger.getErrors());
      setSummary(errorLogger.getErrorSummary());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Toggle with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '50px',
          height: '50px',
          backgroundColor: summary.totalErrors > 0 ? '#ff4757' : '#2ed573',
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '18px',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}
        title="Click to open Debug Panel (Ctrl+Shift+D)"
      >
        {summary.totalErrors || '✓'}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        maxHeight: '500px',
        backgroundColor: '#2c3e50',
        color: 'white',
        borderRadius: '8px',
        padding: '20px',
        fontSize: '14px',
        fontFamily: 'monospace',
        overflow: 'auto',
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#3498db' }}>🔧 Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '5px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#e74c3c' }}>Error Summary</h4>
        <div style={{ backgroundColor: '#34495e', padding: '10px', borderRadius: '4px' }}>
          <div>Total Errors: <span style={{ color: summary.totalErrors > 0 ? '#e74c3c' : '#2ed573' }}>{summary.totalErrors}</span></div>
          {Object.entries(summary.componentCounts).map(([component, count]) => (
            <div key={component}>
              {component}: <span style={{ color: '#f39c12' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {summary.latestError && (
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#e67e22' }}>Latest Error</h4>
          <div style={{ backgroundColor: '#34495e', padding: '10px', borderRadius: '4px' }}>
            <div><strong>Component:</strong> {summary.latestError.component}</div>
            <div><strong>Message:</strong> {summary.latestError.message}</div>
            <div><strong>Time:</strong> {new Date(summary.latestError.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#9b59b6' }}>Recent Errors</h4>
        <div style={{ maxHeight: '200px', overflow: 'auto' }}>
          {errors.length === 0 ? (
            <div style={{ color: '#2ed573' }}>No errors logged ✓</div>
          ) : (
            errors.slice(-5).reverse().map((error, index) => (
              <details key={index} style={{ marginBottom: '5px', backgroundColor: '#34495e', borderRadius: '4px' }}>
                <summary style={{ padding: '8px', cursor: 'pointer' }}>
                  <span style={{ color: '#e74c3c' }}>[{error.component}]</span> {error.message.substring(0, 50)}...
                </summary>
                <div style={{ padding: '8px', fontSize: '12px', borderTop: '1px solid #4a6741' }}>
                  <div><strong>Action:</strong> {error.action}</div>
                  <div><strong>Time:</strong> {new Date(error.timestamp).toLocaleString()}</div>
                  {error.stack && (
                    <details>
                      <summary>Stack Trace</summary>
                      <pre style={{ fontSize: '10px', overflow: 'auto' }}>{error.stack}</pre>
                    </details>
                  )}
                </div>
              </details>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            errorLogger.clearErrors();
            setErrors([]);
            setSummary(errorLogger.getErrorSummary());
          }}
          style={{
            padding: '8px 12px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Clear Errors
        </button>
        <button
          onClick={() => {
            const data = {
              summary: errorLogger.getErrorSummary(),
              errors: errorLogger.getErrors(),
              timestamp: new Date().toISOString(),
              url: window.location.href,
              userAgent: navigator.userAgent
            };
            console.log('Debug Report:', data);
            navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
          }}
          style={{
            padding: '8px 12px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Export Report
        </button>
      </div>

      <div style={{ marginTop: '10px', fontSize: '11px', color: '#95a5a6' }}>
        Press Ctrl+Shift+D to toggle | Check console for full details
      </div>
    </div>
  );
}