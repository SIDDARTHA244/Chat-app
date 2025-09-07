import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing
} from 'react-native';

const TypingIndicator = ({ isVisible, userName }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Fade in animation
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Bouncing dots animation
      const animateDots = () => {
        const createDotAnimation = (dot, delay) => {
          return Animated.loop(
            Animated.sequence([
              Animated.delay(delay),
              Animated.timing(dot, {
                toValue: -8,
                duration: 400,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                useNativeDriver: true,
              }),
              Animated.timing(dot, {
                toValue: 0,
                duration: 400,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                useNativeDriver: true,
              }),
            ])
          );
        };

        Animated.parallel([
          createDotAnimation(dot1, 0),
          createDotAnimation(dot2, 200),
          createDotAnimation(dot3, 400),
        ]).start();
      };

      animateDots();
    } else {
      // Fade out animation
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Stop dot animations
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.bubble}>
        <Text style={styles.text}>
          {userName} is typing
        </Text>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  bubble: {
    backgroundColor: '#F0F0F0',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  text: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
    marginHorizontal: 1,
  },
});

export default TypingIndicator;
