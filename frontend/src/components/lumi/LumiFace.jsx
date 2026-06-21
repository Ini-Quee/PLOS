import { useState, useEffect } from 'react';

/**
 * LumiFace — Lumi's living face: two warm glowing eyes.
 * Subtle, ambient, never aggressive. A gentle presence.
 *
 * Props:
 *  - mood: 'resting' | 'thinking' | 'happy' | 'listening' | 'concerned'
 *  - size: number (px). Default 96.
 *  - showOrb: boolean — render the dark orb backdrop. Default true.
 *  - tint: per-domain eye color override.
 *  - subtle: boolean — extra-quiet mode for sidebar/icons. Default false.
 */

const COLORS = {
  pupil: '#1a1008',
  highlight: 'rgba(255,255,255,0.85)',
};

const MOOD_LABEL = {
  resting: 'Lumi is here',
  thinking: 'Lumi is thinking',
  happy: 'Lumi is pleased',
  listening: 'Lumi is listening',
  concerned: 'Lumi is here with you',
};

const MOOD_COLOR = {
  resting:   { inner: '#F1D98A', outer: '#C8955C', glow: '200,149,92' },
  happy:     { inner: '#F5C98A', outer: '#E8A87C', glow: '232,168,124' },
  thinking:  { inner: '#B8D4F0', outer: '#5B9BD6', glow: '91,155,214' },
  listening: { inner: '#A8E8D8', outer: '#3FC7AC', glow: '63,199,172' },
  concerned: { inner: '#D5C8E8', outer: '#9D8BC9', glow: '157,139,201' },
};

let injected = false;
function injectKeyframes() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
@keyframes lumiBlink{0%,43%,49%,100%{transform:scaleY(1)}46%{transform:scaleY(.08)}}
@keyframes lumiBlinkSlow{0%,46%,52%,100%{transform:scaleY(1)}49%{transform:scaleY(.08)}}
@keyframes lumiGlow{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes lumiGlowFast{0%,100%{opacity:.65}50%{opacity:1}}
@keyframes lumiLookUp{0%,100%{transform:translateY(0)}40%,60%{transform:translateY(-2px)}}
@keyframes lumiBounce{0%,100%{transform:translateY(0)}30%{transform:translateY(-3px)}60%{transform:translateY(0)}}
@keyframes lumiListenPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.lumi-eye{transform-origin:center}
@media (prefers-reduced-motion: reduce){
  .lumi-eye, .lumi-eye *{animation:none !important}
}`;
  const el = document.createElement('style');
  el.setAttribute('data-lumi-face', '');
  el.textContent = css;
  document.head.appendChild(el);
}

export default function LumiFace({
  mood = 'resting',
  size = 96,
  showOrb = true,
  tint = null,
  subtle = false,
  className = '',
  style = {},
  onClick,
}) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    injectKeyframes();
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const fn = (e) => setReduced(e.matches);
    mq.addEventListener ? mq.addEventListener('change', fn) : mq.addListener(fn);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', fn) : mq.removeListener(fn); };
  }, []);

  const TINT = {
    gold:     MOOD_COLOR.resting,
    rosy:     MOOD_COLOR.happy,
    blue:     MOOD_COLOR.thinking,
    teal:     MOOD_COLOR.listening,
    lavender: MOOD_COLOR.concerned,
    green:    { inner: '#B8D8A0', outer: '#5E9E3E', glow: '94,158,62' },
  };

  const mc = (tint && TINT[tint]) || MOOD_COLOR[mood] || MOOD_COLOR.resting;
  const animsOn = !reduced;

  // Geometry — tiny, ambient, like a distant light
  const eyeScale = subtle ? 0.22 : (showOrb ? 0.28 : 0.40);
  const eyeD = Math.round(size * eyeScale);
  const gap = Math.round(size * 0.12);
  const pupilD = Math.round(eyeD * 0.32);

  const isHappy = mood === 'happy';
  const isConcern = mood === 'concerned';
  const isThinking = mood === 'thinking';
  const isListening = mood === 'listening';

  const irisFill = isThinking
    ? `radial-gradient(circle at 50% 45%, rgba(255,255,255,0.4), ${mc.inner} 35%, ${mc.outer} 75%)`
    : `radial-gradient(circle at 50% 45%, ${mc.inner}, ${mc.outer} 72%)`;

  const glowIntensity = subtle ? 0.15 : 0.30;

  const Eye = ({ side }) => {
    if (isHappy) {
      const crescentH = Math.round(eyeD * 0.5);
      return (
        <span style={{
          width: eyeD, height: crescentH,
          borderRadius: `0 0 ${eyeD}px ${eyeD}px`,
          background: `linear-gradient(${mc.outer}, ${mc.inner})`,
          boxShadow: `0 0 ${subtle ? 6 : 10}px rgba(${mc.glow},${glowIntensity})`,
          animation: animsOn ? `lumiBounce 2s ease-in-out ${side === 'r' ? '.12s' : '0s'} infinite` : 'none',
          display: 'inline-block',
        }} />
      );
    }

    let w = eyeD, h = eyeD, tilt = 0, pupilOpacity = 1, pupilSize = pupilD, pupilShift = 0;
    if (isConcern) { w = Math.round(eyeD * 0.94); h = Math.round(eyeD * 0.82); tilt = side === 'r' ? -6 : 6; pupilShift = 1; }
    if (isThinking) { pupilOpacity = 0.5; pupilSize = Math.round(pupilD * 0.7); }
    if (isListening) { w = Math.round(eyeD * 1.04); h = Math.round(eyeD * 1.04); }

    let anim = 'none';
    if (animsOn) {
      if (isThinking) anim = `lumiBlinkSlow 5s cubic-bezier(.22,1,.36,1) infinite, lumiGlowFast 2.8s ease-in-out infinite, lumiLookUp 4.5s ease-in-out infinite`;
      else if (isListening) anim = `lumiListenPulse 1.8s ease-in-out ${side === 'r' ? '.15s' : '0s'} infinite, lumiGlowFast 1.8s ease-in-out infinite`;
      else if (isConcern) anim = `lumiBlinkSlow 7s cubic-bezier(.22,1,.36,1) infinite`;
      else anim = `lumiBlink 6s cubic-bezier(.22,1,.36,1) ${side === 'r' ? '.12s' : '0s'} infinite, lumiGlow 4s ease-in-out ${side === 'r' ? '.2s' : '0s'} infinite`;
    }

    return (
      <span className="lumi-eye" style={{
        width: w, height: h, borderRadius: '50%', background: irisFill,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `rotate(${tilt}deg)`, animation: anim, position: 'relative',
      }}>
        <span style={{
          width: pupilSize, height: pupilSize, borderRadius: '50%',
          background: COLORS.pupil, opacity: pupilOpacity,
          transform: `translateY(${pupilShift}px)`, position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: pupilSize * 0.15,
            left: pupilSize * 0.42, width: pupilSize * 0.45, height: pupilSize * 0.45,
            borderRadius: '50%', background: COLORS.highlight,
          }} />
        </span>
      </span>
    );
  };

  const cheekD = Math.round(size * 0.12);
  const cheek = (xSign) => (
    <span style={{
      position: 'absolute',
      top: '62%',
      left: `calc(50% + ${xSign * (eyeD * 0.68)}px)`,
      transform: 'translate(-50%, 0)',
      width: cheekD, height: Math.round(cheekD * 0.65), borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(244,140,150,0.4), rgba(244,140,150,0) 70%)',
      pointerEvents: 'none',
    }} />
  );

  const eyes = (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap, opacity: isConcern ? 0.7 : 1, transition: 'opacity .5s ease' }}>
      {isHappy && <>{cheek(-1)}{cheek(1)}</>}
      <Eye side="l" /><Eye side="r" />
    </div>
  );

  const orbBg = subtle
    ? 'radial-gradient(circle, rgba(40,53,38,0.35), rgba(26,36,26,0.20) 70%)'
    : 'radial-gradient(circle, rgba(40,53,38,0.55), rgba(26,36,26,0.40) 70%)';

  const orbGlow = subtle
    ? `0 0 ${size * 0.10}px rgba(${mc.glow},0.08)`
    : `0 0 ${size * 0.18}px rgba(${mc.glow},0.12)`;

  const orbStyle = showOrb ? {
    width: size, height: size, borderRadius: '50%',
    background: orbBg,
    boxShadow: `inset 0 0 0 1px rgba(${mc.glow},.10), ${orbGlow}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  } : { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' };

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', cursor: onClick ? 'pointer' : 'default', ...style }}
      onClick={onClick}
      role="img"
      aria-label={MOOD_LABEL[mood] || 'Lumi'}
    >
      <div style={orbStyle}>
        {eyes}
      </div>
    </div>
  );
}
