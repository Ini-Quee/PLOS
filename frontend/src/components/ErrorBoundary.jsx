import { Component } from 'react';

/**
 * ErrorBoundary — Catches JavaScript errors in child components
 * Prevents entire app crash, shows fallback UI instead
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      const { fallbackMessage } = this.props;
      const errorMessage = this.state.error?.message || 'Unknown error';

      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#0D0D0D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            {/* Warning Icon */}
            <div
              style={{
                fontSize: '64px',
                marginBottom: '24px',
              }}
            >
              ⚠️
            </div>

            {/* Main Message */}
            <h1
              style={{
                color: '#F5F0E8',
                fontSize: '20px',
                fontWeight: 600,
                margin: '0 0 16px 0',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {fallbackMessage || 'Something went wrong'}
            </h1>

            {/* Error Details */}
            <p
              style={{
                color: '#6B5F52',
                fontSize: '14px',
                margin: '0 0 24px 0',
                fontFamily: "'Inter', sans-serif",
                wordBreak: 'break-word',
              }}
            >
              {errorMessage}
            </p>

            {/* Try Again Button */}
            <button
              onClick={this.handleReload}
              style={{
                padding: '12px 24px',
                backgroundColor: '#F5A623',
                border: 'none',
                borderRadius: '12px',
                color: '#0D0D0D',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#E09415';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#F5A623';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Try Again
            </button>

            {/* Technical Details (collapsed) */}
            {this.state.errorInfo && (
              <details style={{ marginTop: '24px', textAlign: 'left' }}>
                <summary
                  style={{
                    color: '#6B5F52',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Technical details
                </summary>
                <pre
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '8px',
                    color: '#6B5F52',
                    fontSize: '11px',
                    overflow: 'auto',
                    maxHeight: '200px',
                    fontFamily: 'ui-monospace, monospace',
                    textAlign: 'left',
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
