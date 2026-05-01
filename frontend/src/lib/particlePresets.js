/**
 * PLOS Cinematic Wallpaper - tsParticles Preset Library
 * Professional particle configurations for weather and atmospheric effects
 */

export const PARTICLE_PRESETS = {
  stars_twinkle: {
    fullScreen: false,
    particles: {
      number: {
        value: 120,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: "#ffffff"
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.3, max: 1 },
        animation: {
          enable: true,
          speed: 0.3,
          sync: false
        }
      },
      size: {
        value: { min: 1, max: 2 }
      },
      move: {
        enable: false
      }
    },
    detectRetina: true
  },

  snowfall: {
    fullScreen: false,
    particles: {
      number: {
        value: 60,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: "#ffffff"
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: 0.7
      },
      size: {
        value: { min: 2, max: 5 }
      },
      move: {
        enable: true,
        speed: { min: 1, max: 3 },
        direction: "bottom",
        straight: false,
        outModes: {
          default: "out",
          bottom: "out",
          left: "out",
          right: "out",
          top: "out"
        },
        wobble: {
          enable: true,
          distance: 10,
          speed: { min: -0.5, max: 0.5 }
        }
      }
    },
    detectRetina: true
  },

  heavy_rain: {
    fullScreen: false,
    particles: {
      number: {
        value: 200,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: "#ffffff"
      },
      shape: {
        type: "line"
      },
      opacity: {
        value: 0.35
      },
      size: {
        value: { min: 15, max: 20 }
      },
      move: {
        enable: true,
        speed: { min: 15, max: 25 },
        direction: "bottom",
        angle: {
          value: 15,
          offset: 0
        },
        straight: true,
        outModes: {
          default: "out"
        }
      },
      stroke: {
        width: 1,
        color: "#ffffff"
      }
    },
    detectRetina: true
  },

  window_rain: {
    fullScreen: false,
    particles: {
      number: {
        value: 100,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: "#ffffff"
      },
      shape: {
        type: "line"
      },
      opacity: {
        value: 0.4
      },
      size: {
        value: { min: 12, max: 18 }
      },
      move: {
        enable: true,
        speed: { min: 8, max: 15 },
        direction: "bottom",
        angle: {
          value: 15,
          offset: 0
        },
        straight: true,
        outModes: {
          default: "out"
        }
      },
      stroke: {
        width: 1,
        color: "#ffffff"
      }
    },
    detectRetina: true
  },

  window_rain_light: {
    fullScreen: false,
    particles: {
      number: {
        value: 50,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: "#ffffff"
      },
      shape: {
        type: "line"
      },
      opacity: {
        value: 0.3
      },
      size: {
        value: { min: 10, max: 15 }
      },
      move: {
        enable: true,
        speed: { min: 5, max: 10 },
        direction: "bottom",
        straight: true,
        outModes: {
          default: "out"
        }
      },
      stroke: {
        width: 1,
        color: "#ffffff"
      }
    },
    detectRetina: true
  },

  cherry_petals: {
    fullScreen: false,
    particles: {
      number: {
        value: 30,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: ["#FFB7C5", "#FF91A4", "#FFE4E8", "#FFC0CB"]
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.4, max: 0.8 }
      },
      size: {
        value: { min: 5, max: 8 }
      },
      move: {
        enable: true,
        speed: { min: 1, max: 3 },
        direction: "bottom",
        straight: false,
        outModes: {
          default: "out"
        },
        wobble: {
          enable: true,
          distance: 15,
          speed: { min: -1, max: 1 }
        },
        rotate: {
          value: 360,
          animation: {
            enable: true,
            speed: 5
          }
        }
      }
    },
    detectRetina: true
  },

  gentle_petals: {
    fullScreen: false,
    particles: {
      number: {
        value: 15,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: ["#FFE4E8", "#FFF0F5", "#E6E6FA"]
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.3, max: 0.6 }
      },
      size: {
        value: { min: 4, max: 7 }
      },
      move: {
        enable: true,
        speed: { min: 0.5, max: 2 },
        direction: "bottom",
        straight: false,
        outModes: {
          default: "out"
        },
        wobble: {
          enable: true,
          distance: 10,
          speed: { min: -0.5, max: 0.5 }
        }
      }
    },
    detectRetina: true
  },

  falling_leaves: {
    fullScreen: false,
    particles: {
      number: {
        value: 25,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: ["#E67E22", "#C0392B", "#F39C12", "#8B4513", "#D2691E"]
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.6, max: 0.9 }
      },
      size: {
        value: { min: 6, max: 10 }
      },
      move: {
        enable: true,
        speed: { min: 2, max: 4 },
        direction: "bottom",
        straight: false,
        outModes: {
          default: "out"
        },
        wobble: {
          enable: true,
          distance: 20,
          speed: { min: -1.5, max: 1.5 }
        },
        rotate: {
          value: 360,
          animation: {
            enable: true,
            speed: 10
          }
        }
      }
    },
    detectRetina: true
  },

  harmattan_dust: {
    fullScreen: false,
    particles: {
      number: {
        value: 50,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: "rgba(210, 180, 140, 0.6)"
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.3, max: 0.6 }
      },
      size: {
        value: { min: 1, max: 2 }
      },
      move: {
        enable: true,
        speed: { min: 0.5, max: 2 },
        direction: "right",
        straight: false,
        outModes: {
          default: "out"
        },
        wobble: {
          enable: true,
          distance: 8,
          speed: { min: -0.3, max: 0.3 }
        }
      }
    },
    detectRetina: true
  },

  golden_dust: {
    fullScreen: false,
    particles: {
      number: {
        value: 40,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: "rgba(245, 166, 35, 0.5)"
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.2, max: 0.5 }
      },
      size: {
        value: { min: 1, max: 3 }
      },
      move: {
        enable: true,
        speed: { min: 0.5, max: 1.5 },
        direction: "top",
        straight: false,
        outModes: {
          default: "out"
        }
      }
    },
    detectRetina: true
  },

  ember_glow: {
    fullScreen: false,
    particles: {
      number: {
        value: 25,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: ["#FF6B35", "#F5A623", "#FF4500", "#FFD700"]
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.4, max: 0.7 },
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 0,
          sync: false
        }
      },
      size: {
        value: { min: 3, max: 6 }
      },
      move: {
        enable: true,
        speed: { min: 1, max: 4 },
        direction: "top",
        straight: false,
        outModes: {
          default: "out"
        },
        wobble: {
          enable: true,
          distance: 15,
          speed: { min: -1, max: 1 }
        }
      }
    },
    detectRetina: true
  },

  rising_mist: {
    fullScreen: false,
    particles: {
      number: {
        value: 8,
        density: {
          enable: false
        }
      },
      color: {
        value: "#ffffff"
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.03, max: 0.06 }
      },
      size: {
        value: { min: 100, max: 300 }
      },
      move: {
        enable: true,
        speed: { min: 0.2, max: 0.5 },
        direction: "top",
        straight: false,
        outModes: {
          default: "out"
        }
      }
    },
    detectRetina: true
  },

  sea_mist: {
    fullScreen: false,
    particles: {
      number: {
        value: 10,
        density: {
          enable: false
        }
      },
      color: {
        value: "rgba(135, 206, 235, 0.3)"
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.04, max: 0.08 }
      },
      size: {
        value: { min: 80, max: 250 }
      },
      move: {
        enable: true,
        speed: { min: 0.3, max: 0.8 },
        direction: "right",
        straight: false,
        outModes: {
          default: "out"
        }
      }
    },
    detectRetina: true
  },

  dust_motes: {
    fullScreen: false,
    particles: {
      number: {
        value: 20,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: "rgba(255, 248, 220, 0.5)"
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.3, max: 0.5 }
      },
      size: {
        value: { min: 1, max: 2 }
      },
      move: {
        enable: true,
        speed: { min: 0.3, max: 1 },
        direction: "none",
        straight: false,
        outModes: {
          default: "bounce"
        }
      }
    },
    detectRetina: true
  },

  bokeh_float: {
    fullScreen: false,
    particles: {
      number: {
        value: 15,
        density: {
          enable: false
        }
      },
      color: {
        value: "rgba(245, 166, 35, 0.06)"
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.04, max: 0.08 }
      },
      size: {
        value: { min: 20, max: 60 }
      },
      move: {
        enable: true,
        speed: { min: 0.2, max: 0.8 },
        direction: "none",
        straight: false,
        outModes: {
          default: "bounce"
        }
      }
    },
    detectRetina: true
  },

  bokeh_city: {
    fullScreen: false,
    particles: {
      number: {
        value: 18,
        density: {
          enable: false
        }
      },
      color: {
        value: ["rgba(74, 158, 255, 0.12)", "rgba(255, 0, 128, 0.1)", "rgba(0, 255, 200, 0.08)"]
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.05, max: 0.12 }
      },
      size: {
        value: { min: 25, max: 70 }
      },
      move: {
        enable: true,
        speed: { min: 0.3, max: 1 },
        direction: "none",
        straight: false,
        outModes: {
          default: "bounce"
        }
      }
    },
    detectRetina: true
  },

  city_mist: {
    fullScreen: false,
    particles: {
      number: {
        value: 20,
        density: {
          enable: false
        }
      },
      color: {
        value: ["rgba(135, 206, 235, 0.05)", "rgba(74, 158, 255, 0.08)"]
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.03, max: 0.08 }
      },
      size: {
        value: { min: 60, max: 200 }
      },
      move: {
        enable: true,
        speed: { min: 0.2, max: 0.6 },
        direction: "top",
        straight: false,
        outModes: {
          default: "out"
        }
      }
    },
    detectRetina: true
  },

  night_rain: {
    fullScreen: false,
    particles: {
      number: {
        value: 150,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: "rgba(100, 120, 180, 0.3)"
      },
      shape: {
        type: "line"
      },
      opacity: {
        value: 0.35
      },
      size: {
        value: { min: 12, max: 18 }
      },
      move: {
        enable: true,
        speed: { min: 12, max: 20 },
        direction: "bottom",
        angle: {
          value: 15,
          offset: 0
        },
        straight: true,
        outModes: {
          default: "out"
        }
      },
      stroke: {
        width: 1,
        color: "rgba(150, 170, 220, 0.4)"
      }
    },
    detectRetina: true
  },

  snowfall_with_bokeh: {
    fullScreen: false,
    particles: {
      number: {
        value: 50,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: ["#ffffff", "rgba(255, 215, 0, 0.3)", "rgba(255, 100, 100, 0.3)"]
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: { min: 0.4, max: 0.8 }
      },
      size: {
        value: { min: 2, max: 40 }
      },
      move: {
        enable: true,
        speed: { min: 1, max: 3 },
        direction: "bottom",
        straight: false,
        outModes: {
          default: "out"
        },
        wobble: {
          enable: true,
          distance: 12,
          speed: { min: -0.5, max: 0.5 }
        }
      }
    },
    detectRetina: true
  }
};

export default PARTICLE_PRESETS;
