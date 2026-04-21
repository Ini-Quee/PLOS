/**
 * LoadingSpinner — Reusable loading component
 * Shows amber spinner with optional message
 */
export default function LoadingSpinner({ message = 'Loading...', size = 'medium' }) {
  const sizeMap = {
    small: { spinner: 24, fontSize: '14px' },
    medium: { spinner: 48, fontSize: '16px' },
    large: { spinner: 64, fontSize: '18px' },
  };

  const { spinner, fontSize } = sizeMap[size] || sizeMap.medium;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D0D0D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: `${spinner}px`,
          height: `${spinner}px`,
          border: `3px solid rgba(245, 166, 35, 0.2)`,
          borderTopColor: '#F5A623',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />

      {/* Message */}
      <p
        style={{
          color: '#A89880',
          fontSize,
          margin: 0,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {message}
      </p>

      {/* Keyframes for spinner */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
