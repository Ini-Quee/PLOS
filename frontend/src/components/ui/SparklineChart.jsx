import { motion } from 'framer-motion';
import { Colors } from '../../lib/colors';
import { Typography, FontWeights } from '../../lib/typography';

/**
 * SparklineChart - Mini line chart for trends
 * Shows activity over time with smooth curves
 */

export default function SparklineChart({ 
  data = [], // Array of numbers
  labels = [], // Optional labels for each point
  color = '#F5A623',
  width = 200,
  height = 60,
  showDots = true,
  showArea = true,
  delay = 0,
}) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  // Calculate points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 10) - 5; // Padding
    return { x, y, value, index };
  });

  // Create SVG path
  const linePath = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    
    const prev = points[index - 1];
    const c1x = prev.x + (point.x - prev.x) / 3;
    const c1y = prev.y;
    const c2x = point.x - (point.x - prev.x) / 3;
    const c2y = point.y;
    
    return `${path} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${point.x} ${point.y}`;
  }, '');

  // Create area path (for gradient fill)
  const areaPath = showArea 
    ? `${linePath} L ${width} ${height} L 0 ${height} Z`
    : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        width: '100%',
        position: 'relative',
      }}
    >
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{
          overflow: 'visible',
        }}
      >
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id={`sparkline-gradient-${delay}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id={`sparkline-glow-${delay}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Area fill */}
        {showArea && (
          <motion.path
            d={areaPath}
            fill={`url(#sparkline-gradient-${delay})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3, duration: 0.5 }}
          />
        )}

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#sparkline-glow-${delay})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ 
            delay: delay + 0.2, 
            duration: 1.2,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        />

        {/* Data dots */}
        {showDots && points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={index === points.length - 1 ? 4 : 2} // Larger dot for latest
            fill={index === points.length - 1 ? color : Colors.background}
            stroke={color}
            strokeWidth={index === points.length - 1 ? 0 : 1}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: delay + 0.8 + index * 0.05,
              duration: 0.2,
              type: 'spring',
              stiffness: 300,
            }}
            style={{
              filter: index === points.length - 1 
                ? `drop-shadow(0 0 4px ${color})`
                : 'none',
            }}
          />
        ))}
      </svg>

      {/* Tooltip showing latest value */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 1.2, duration: 0.3 }}
        style={{
          position: 'absolute',
          right: 0,
          top: -20,
          fontSize: Typography.caption.fontSize,
          fontWeight: FontWeights.semibold,
          color: color,
        }}
      >
        {data[data.length - 1]}
      </motion.div>
    </motion.div>
  );
}
