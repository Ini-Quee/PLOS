/**
 * PLOS Motion Design System
 *
 * Inspired by: Linear, Apple, Stripe, Raycast
 * Philosophy: Smooth, natural, physics-based animations
 */

export const transitions = {
  // Spring physics (use for UI elements)
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  // Smooth ease (use for page transitions)
  smooth: {
    type: 'tween',
    ease: [0.25, 0.1, 0.25, 1], // Custom bezier
    duration: 0.4,
  },
  // Quick snap (use for toggles, checkboxes)
  snap: {
    type: 'spring',
    stiffness: 500,
    damping: 40,
    mass: 0.5,
  },
  // Bouncy (use for success states, celebrations)
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 15,
  },
};

export const animations = {
  // Fade in from below (use for modals, cards)
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: transitions.smooth,
  },
  // Fade in from right (use for drawer/sidebar)
  fadeInRight: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
    transition: transitions.smooth,
  },
  // Scale in (use for popups, tooltips)
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: transitions.spring,
  },
  // Stagger children (use for lists)
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  },
  // Stagger item
  staggerItem: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  },
  // Hover lift (use for cards, buttons)
  hoverLift: {
    scale: 1.02,
    y: -4,
    transition: transitions.snap,
  },
  // Tap feedback
  tap: {
    scale: 0.98,
  },
  // Pulse (use for notifications, badges)
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 2,
    },
  },
};

// Gesture variants
export const gestures = {
  hover: {
    scale: 1.05,
  },
  tap: {
    scale: 0.95,
  },
};

// Page transition variants
export const pageTransitions = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: transitions.smooth,
};

// Book animation variants
export const bookAnimations = {
  // Book spine on shelf
  spine: {
    rest: {
      rotateY: 0,
      z: 0,
    },
    hover: {
      rotateY: -15,
      z: 20,
      transition: transitions.spring,
    },
  },
  // Book opening
  open: {
    closed: {
      rotateY: 0,
      scale: 1,
    },
    opening: {
      rotateY: -30,
      scale: 1.1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    open: {
      rotateY: -90,
      scale: 1.2,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  },
  // Page flip
  pageFlip: {
    front: {
      rotateY: 0,
    },
    flipping: {
      rotateY: -90,
      transition: {
        duration: 0.5,
        ease: [0.645, 0.045, 0.355, 1],
      },
    },
    back: {
      rotateY: -180,
    },
  },
  // Text writing (letter by letter)
  writing: {
    hidden: { opacity: 0 },
    visible: (i) => ({
      opacity: 1,
      transition: {
        delay: i * 0.03,
        duration: 0.1,
      },
    }),
  },
};

// Microphone animation
export const micAnimations = {
  idle: {
    scale: 1,
    opacity: 0.7,
  },
  listening: {
    scale: [1, 1.2, 1],
    opacity: 1,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  pulse: {
    boxShadow: [
      '0 0 0 0 rgba(245, 166, 35, 0.4)',
      '0 0 0 20px rgba(245, 166, 35, 0)',
    ],
    transition: {
      duration: 1,
      repeat: Infinity,
    },
  },
};

// Hand animation for writing
export const handAnimations = {
  writing: {
    x: [0, 10, 20, 30, 40, 50],
    y: [0, -2, 0, 2, 0, -1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  resting: {
    x: 0,
    y: 0,
    rotate: 0,
    transition: transitions.spring,
  },
};

export default {
  transitions,
  animations,
  gestures,
  pageTransitions,
  bookAnimations,
  micAnimations,
  handAnimations,
};
