import { useEffect, useRef } from "react";
import { Animated } from "react-native";

/**
 * Shared entrance + floating hero animation for onboarding screens.
 * Returns animated values to apply to the content wrapper and hero image.
 *
 * Usage:
 *   const { fade, slideUp, heroFloat } = useOnboardingAnimation();
 *   <Animated.View style={{ opacity: fade, transform: [{ translateY: slideUp }] }}>
 *     <Animated.View style={{ transform: [{ translateY: heroFloat }] }}>
 *       <HeroSvg />
 *     </Animated.View>
 *   </Animated.View>
 */
export default function useOnboardingAnimation({ delay = 0 } = {}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const heroFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 480, delay, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 480, delay, useNativeDriver: true }),
    ]);

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, { toValue: -10, duration: 2800, useNativeDriver: true }),
        Animated.timing(heroFloat, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    );

    entrance.start(() => float.start());

    return () => {
      entrance.stop();
      float.stop();
    };
  }, [fade, slideUp, heroFloat, delay]);

  return { fade, slideUp, heroFloat };
}
