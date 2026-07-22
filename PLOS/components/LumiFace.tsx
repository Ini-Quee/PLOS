import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

type Mood = 'resting' | 'thinking' | 'happy' | 'listening' | 'concerned';

interface LumiFaceProps {
  mood?: Mood;
  size?: number;
}

export default function LumiFace({ mood = 'resting', size = 48 }: LumiFaceProps) {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const thinkAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Blink loop
  useEffect(() => {
    const blink = () => {
      Animated.sequence([
        Animated.delay(2000 + Math.random() * 2000),
        Animated.timing(blinkAnim, {
          toValue: 0.1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start(() => blink());
    };
    blink();
  }, []);

  // Thinking pulse
  useEffect(() => {
    if (mood === 'thinking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(thinkAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(thinkAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      thinkAnim.setValue(0);
    }
  }, [mood]);

  // Happy bounce
  useEffect(() => {
    if (mood === 'happy') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -3,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      bounceAnim.setValue(0);
    }
  }, [mood]);

  const eyeColor = '#C8955C';
  const bgColor = 'rgba(200, 149, 92, 0.12)';
  const eyeSize = size * 0.18;
  const eyeGap = size * 0.22;

  const getMouthStyle = () => {
    switch (mood) {
      case 'happy':
        return { width: size * 0.3, borderRadius: size * 0.15, borderBottomWidth: 2, borderBottomColor: eyeColor };
      case 'concerned':
        return { width: size * 0.2, borderRadius: size * 0.1, borderTopWidth: 2, borderTopColor: eyeColor };
      case 'thinking':
        return { width: size * 0.12, height: size * 0.12, borderRadius: size * 0.06, backgroundColor: eyeColor };
      default:
        return { width: size * 0.22, borderRadius: size * 0.11, borderBottomWidth: 2, borderBottomColor: eyeColor };
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          transform: [{ translateY: bounceAnim }],
        },
      ]}
    >
      {/* Eyes */}
      <View style={[styles.eyes, { gap: eyeGap }]}>
        <Animated.View
          style={[
            styles.eye,
            {
              width: eyeSize,
              height: eyeSize,
              borderRadius: eyeSize / 2,
              backgroundColor: eyeColor,
              scaleY: blinkAnim,
            },
            mood === 'listening' && { transform: [{ scaleX: 1.2 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.eye,
            {
              width: eyeSize,
              height: eyeSize,
              borderRadius: eyeSize / 2,
              backgroundColor: eyeColor,
              scaleY: blinkAnim,
            },
            mood === 'listening' && { transform: [{ scaleX: 1.2 }] },
          ]}
        />
      </View>

      {/* Mouth */}
      <View style={[styles.mouth, { marginTop: size * 0.12 }, getMouthStyle()]} />

      {/* Thinking dots */}
      {mood === 'thinking' && (
        <View style={[styles.thinkDots, { right: size * 0.08, top: size * 0.08 }]}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.thinkDot,
                {
                  width: size * 0.06,
                  height: size * 0.06,
                  borderRadius: size * 0.03,
                  backgroundColor: eyeColor,
                  opacity: thinkAnim,
                },
              ]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eye: {
    opacity: 0.9,
  },
  mouth: {
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  thinkDots: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 2,
  },
  thinkDot: {
    opacity: 0.6,
  },
});
