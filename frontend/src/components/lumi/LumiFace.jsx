import { useState, useEffect } from 'react';

/**
 * LumiFace — Lumi's living face: two warm gold eyes with five moods.
 * Curious, kind, never witchy (no black pupils, no green ring).
 *
 * Props:
 *  - mood: 'resting' | 'thinking' | 'happy' | 'listening' | 'concerned'
 *  - size: number (px height of the orb; eyes scale from it). Default 96.
 *  - showOrb: boolean — render the dark orb backdrop behind the eyes. Default true.
 *  - className, style, onClick
 *
 * Pure CSS animation. Honors prefers-reduced-motion (no blink/bounce/pulse,
 * mood still reads via pupil/tilt/crescent shape).
 */

const COLORS = {
  irisLight: '#F1D98A',
  iris: '#D6B85A',
  irisWarm: '#C8955C',
  pupil: '#2a1d0e',
  highlight: 'rgba(255,255,255,0.92)',
};

const MOOD_LABEL = {
  resting: 'Lumi is here',
  thinking: 'Lumi is thinking',
  happy: 'Lumi is pleased',
  listening: 'Lumi is listening',
  concerned: 'Lumi is here with you',
};

// Per-mood eye colour: warm = positive/present, cool = focus/attention, muted = empathy.
// Gold is Lumi's home. inner=highlight core, outer=iris edge, glow=rgba glow channel.
const MOOD_COLOR = {
  resting:   { inner: '#F1D98A', outer: '#C8955C', glow: '241,217,138' }, // gold
  happy:     { inner: '#F5C98A', outer: '#E8A87C', glow: '245,180,140' }, // rosy gold
  thinking:  { inner: '#CFE6FF', outer: '#5B9BD6', glow: '140,190,240' }, // soft blue
  listening: { inner: '#C4F5EA', outer: '#3FC7AC', glow: '120,225,205' }, // teal
  concerned: { inner: '#E3D8F5', outer: '#9D8BC9', glow: '190,170,230' }, // lavender
};

let injected = false;
function injectKeyframes() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
@keyframes lumiBlink{0%,43%,49%,100%{transform:scaleY(1)}46%{transform:scaleY(.08)}}
@keyframes lumiBlinkSlow{0%,46%,52%,100%{transform:scaleY(1)}49%{transform:scaleY(.08)}}
@keyframes lumiBreathe{0%,100%{box-shadow:0 0 11px rgba(241,217,138,.4),0 0 28px rgba(214,184,90,.2)}50%{box-shadow:0 0 17px rgba(241,217,138,.6),0 0 46px rgba(214,184,90,.32)}}
@keyframes lumiBreatheFast{0%,100%{box-shadow:0 0 10px rgba(241,217,138,.45),0 0 26px rgba(214,184,90,.24)}50%{box-shadow:0 0 20px rgba(241,217,138,.7),0 0 56px rgba(214,184,90,.4)}}
@keyframes lumiLookUp{0%,100%{transform:translateY(0)}40%,60%{transform:translateY(-3px)}}
@keyframes lumiBounce{0%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}60%{transform:translateY(0)}}
@keyframes lumiListenPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes lumiRing{0%,100%{opacity:.2;transform:scale(.92)}50%{opacity:.65;transform:scale(1.08)}}
.lumi-eye{transform-origin:center}
@media (prefers-reduced-motion: reduce){
  .lumi-eye, .lumi-eye *{animation:none !important}
  .lumi-ring{display:none !important}
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
  tint = null,        // optional per-domain eye color: 'gold'|'green'|'blue'|'teal'|'lavender'|'rosy'
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

  // geometry from size (ratios per the spec)
  const eyeD = Math.round(size * (showOrb ? 0.40 : 0.62));
  const gap = Math.round(size * 0.16);
  const pupilD = Math.round(eyeD * 0.46);
  const animsOn = !reduced;

  // per-mood eye config
  const isHappy = mood === 'happy';
  const isConcern = mood === 'concerned';
  const isThinking = mood === 'thinking';
  const isListening = mood === 'listening';

  const TINT = {
    gold:     MOOD_COLOR.resting,
    rosy:     MOOD_COLOR.happy,
    blue:     MOOD_COLOR.thinking,
    teal:     MOOD_COLOR.listening,
    lavender: MOOD_COLOR.concerned,
    green:    { inner: '#C7E89A', outer: '#5E9E3E', glow: '150,200,110' },
  };
  // tint overrides mood color (for per-domain logos); mood still drives motion/shape.
  const mc = (tint && TINT[tint]) || MOOD_COLOR[mood] || MOOD_COLOR.resting;
  const irisFill = isThinking
    ? `radial-gradient(circle at 50% 45%, #fff, ${mc.inner} 32%, ${mc.outer} 74%)`
    : `radial-gradient(circle at 50% 45%, ${mc.inner}, ${mc.outer} 72%)`;

  // eye element builder
  const Eye = ({ side }) => {
    // HAPPY → upturned crescent, no pupil
    if (isHappy) {
      const crescentH = Math.round(eyeD * 0.55);
      return (
        <span style={{
          width: eyeD, height: crescentH,
          borderRadius: `0 0 ${eyeD}px ${eyeD}px`,
          background: `linear-gradient(${mc.outer}, ${mc.inner})`,
          boxShadow: `0 0 14px rgba(${mc.glow},.55)`,
          animation: animsOn ? `lumiBounce 1.8s ease-in-out ${side === 'r' ? '.12s' : '0s'} infinite` : 'none',
          display: 'inline-block',
        }} />
      );
    }

    // dimensions per mood
    let w = eyeD, h = eyeD, tilt = 0, pupilOpacity = 1, pupilSize = pupilD, pupilShift = 0;
    if (isConcern) { w = Math.round(eyeD * 0.94); h = Math.round(eyeD * 0.82); tilt = side === 'r' ? -8 : 8; pupilShift = 2; }
    if (isThinking) { pupilOpacity = 0.5; pupilSize = Math.round(pupilD * 0.7); }
    if (isListening) { w = Math.round(eyeD * 1.06); h = Math.round(eyeD * 1.06); }

    // animation stack per mood
    let anim = 'none';
    if (animsOn) {
      if (isThinking) anim = `lumiBlinkSlow 5s cubic-bezier(.22,1,.36,1) infinite, lumiBreatheFast 2.4s ease-in-out infinite, lumiLookUp 4s ease-in-out infinite`;
      else if (isListening) anim = `lumiListenPulse 1.6s ease-in-out ${side === 'r' ? '.15s' : '0s'} infinite, lumiBreatheFast 1.6s ease-in-out infinite`;
      else if (isConcern) anim = `lumiBlinkSlow 7s cubic-bezier(.22,1,.36,1) infinite`;
      else anim = `lumiBlink 6s cubic-bezier(.22,1,.36,1) ${side === 'r' ? '.12s' : '0s'} infinite, lumiBreathe 3.8s ease-in-out ${side === 'r' ? '.2s' : '0s'} infinite`;
    }

    return (
      <span className="lumi-eye" style={{
        width: w, height: h, borderRadius: '50%', background: irisFill,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `rotate(${tilt}deg)`, animation: anim, position: 'relative',
        boxShadow: 'inset 0 0 0 1px rgba(120,80,30,0.25)',
      }}>
        <span style={{
          width: pupilSize, height: pupilSize, borderRadius: '50%',
          background: COLORS.pupil, opacity: pupilOpacity,
          transform: `translateY(${pupilShift}px)`, position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: pupilSize * 0.12,
            left: pupilSize * 0.46, width: pupilSize * 0.5, height: pupilSize * 0.5,
            borderRadius: '50%', background: COLORS.highlight,
          }} />
        </span>
      </span>
    );
  };

  // Rosy cheeks when happy — soft pink blush below the eyes
  const cheekD = Math.round(size * 0.16);
  const cheek = (xSign) => (
    <span style={{
      position: 'absolute',
      top: '62%',
      left: `calc(50% + ${xSign * (eyeD * 0.72)}px)`,
      transform: 'translate(-50%, 0)',
      width: cheekD, height: Math.round(cheekD * 0.7), borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(244,140,150,0.55), rgba(244,140,150,0) 70%)',
      pointerEvents: 'none',
    }} />
  );

  const eyes = (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap, opacity: isConcern ? 0.72 : 1, transition: 'opacity .5s ease' }}>
      {isHappy && <>{cheek(-1)}{cheek(1)}</>}
      <Eye side="l" /><Eye side="r" />
    </div>
  );

  const orbStyle = showOrb ? {
    width: size, height: size, borderRadius: '50%',
    background: 'radial-gradient(circle, #283526, #1a241a 70%)',
    boxShadow: `inset 0 0 0 1px rgba(214,184,90,.14)${isThinking || isListening ? ', 0 0 40px rgba(200,149,92,.18)' : ''}`,
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
        {/* thinking rings */}
        {isThinking && animsOn && (
          <>
            <span className="lumi-ring" style={{ position: 'absolute', width: size * 1.25, height: size * 0.66, borderRadius: '50%', border: '1px solid rgba(214,184,90,.18)', animation: 'lumiRing 4.2s cubic-bezier(.22,1,.36,1) infinite' }} />
            <span className="lumi-ring" style={{ position: 'absolute', width: size * 1.5, height: size * 0.8, borderRadius: '50%', border: '1px solid rgba(127,184,127,.14)', animation: 'lumiRing 5.4s cubic-bezier(.22,1,.36,1) .8s infinite' }} />
          </>
        )}
        {eyes}
      </div>
    </div>
  );
}
