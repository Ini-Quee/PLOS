import { Component } from 'react';

/**
 * ErrorBoundary — catches errors in child components.
 *
 * Props:
 *   compact (bool)        — inline widget fallback instead of full page
 *   fallbackMessage (str) — custom message for full-page mode
 *   label (str)           — short name shown in compact mode ("Habits", "Dashboard")
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] caught:', error);
    this.setState({ errorInfo });
  }

  retry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { compact, fallbackMessage, label } = this.props;

    // ── Compact: inline card fallback ──────────────────────────────────────────
    if (compact) {
      return (
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.12)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 12, color: 'rgba(255,255,255,0.4)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span>{label ? `${label} couldn't load.` : "This section couldn't load."}</span>
          <button
            onClick={this.retry}
            style={{
              marginLeft: 'auto', fontSize: 11, padding: '3px 10px',
              borderRadius: 8, border: '1px solid rgba(245,166,35,0.3)',
              background: 'transparent', color: '#C8955C', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >Retry</button>
        </div>
      );
    }

    // ── Full page fallback ─────────────────────────────────────────────────────
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#0D0D0D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>⚠️</div>
          <h1 style={{ color: '#F5F0E8', fontSize: '20px', fontWeight: 600, margin: '0 0 12px 0' }}>
            {fallbackMessage || 'Something went wrong'}
          </h1>
          <p style={{ color: '#6B5F52', fontSize: '13px', margin: '0 0 24px 0', lineHeight: 1.6 }}>
            Your data is safe — nothing was lost. You can try reloading this section.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={this.retry}
              style={{
                padding: '10px 22px', backgroundColor: '#F5A623', border: 'none',
                borderRadius: '12px', color: '#0D0D0D', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer',
              }}
            >Try again</button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 22px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px',
                color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer',
              }}
            >Reload page</button>
          </div>
          {this.state.errorInfo && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary style={{ color: '#6B5F52', fontSize: '11px', cursor: 'pointer' }}>
                Technical details
              </summary>
              <pre style={{
                marginTop: '10px', padding: '10px', backgroundColor: '#1A1A1A',
                borderRadius: '8px', color: '#6B5F52', fontSize: '10px',
                overflow: 'auto', maxHeight: '180px', fontFamily: 'monospace',
              }}>
                {this.state.error?.message}{'\n'}{this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
