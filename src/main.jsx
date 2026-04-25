import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AccessGate from './components/AccessGate'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('GamePlan crash:', error, info?.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#000', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{ maxWidth: 440, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 4, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontFamily: 'monospace', fontSize: "var(--gp-type-compact)", color: '#000', letterSpacing: '0.08em' }}>GP</div>
            <div style={{ fontFamily: 'monospace', fontSize: "var(--gp-type-compact)", color: '#D71921', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>⚠ App Error</div>
            <div style={{ fontFamily: 'monospace', fontSize: "var(--gp-type-caption)", color: '#555', marginBottom: 24, wordBreak: 'break-all', lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </div>
            <button
              onClick={() => { localStorage.removeItem('nbss-app-version'); window.location.reload(); }}
              style={{ padding: '12px 28px', borderRadius: 8, border: 'none', background: '#fff', color: '#000', fontFamily: 'monospace', fontSize: "var(--gp-type-small)", cursor: 'pointer', fontWeight: 700, letterSpacing: '0.06em', marginRight: 10 }}
            >
              RELOAD
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AccessGate>
        <App />
      </AccessGate>
    </ErrorBoundary>
  </React.StrictMode>
)
