import { C } from '../layout/SidebarLayout';

export default function SkeletonCard({ height = 100, lines = 2 }) {
  const shimmer = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    borderRadius: 6,
  };

  return (
    <div style={{
      background: 'rgba(6,6,14,0.30)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: '18px 20px',
      minHeight: height,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
      <div style={{ ...shimmer, height: 14, width: '55%' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ ...shimmer, height: 10, width: i === lines - 1 ? '38%' : '80%' }} />
      ))}
    </div>
  );
}
