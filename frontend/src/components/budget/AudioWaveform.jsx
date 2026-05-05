import { memo } from 'react';

const AudioWaveform = memo(function AudioWaveform({ bars = [], color = '#C8955C' }) {
  const barWidth = 5;
  const gap = 3;
  const height = 44;
  const count = 20;
  const totalWidth = count * (barWidth + gap) - gap;

  return (
    <svg width={totalWidth} height={height} viewBox={`0 0 ${totalWidth} ${height}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const h = Math.max(2, bars[i] || 2);
        const x = i * (barWidth + gap);
        const y = (height - h) / 2;
        const opacity = 0.5 + (h / 40) * 0.5;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            rx="2.5"
            fill={color}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}, (prev, next) => {
  if (prev.color !== next.color) return false;
  if (prev.bars.length !== next.bars.length) return false;
  for (let i = 0; i < prev.bars.length; i++) {
    if (prev.bars[i] !== next.bars[i]) return false;
  }
  return true;
});

export default AudioWaveform;
