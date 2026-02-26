
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

// Suppress benign WebSocket errors in the AI Studio environment
if (typeof window !== 'undefined') {
  const isWebSocketError = (err: any) => {
    const message = err?.message || (typeof err === 'string' ? err : '');
    const reason = err?.reason?.message || (typeof err?.reason === 'string' ? err.reason : '');
    const stack = err?.reason?.stack || err?.stack || '';
    
    return [message, reason, stack].some(s => 
      s && typeof s === 'string' && (s.includes('WebSocket') || s.includes('ws://') || s.includes('wss://'))
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isWebSocketError(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('error', (event) => {
    if (isWebSocketError(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  // Intercept console methods
  const filterArgs = (args: any[]) => args.some(isWebSocketError);
  
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (filterArgs(args)) return;
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (filterArgs(args)) return;
    originalConsoleWarn.apply(console, args);
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
