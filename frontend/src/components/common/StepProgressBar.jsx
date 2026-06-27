import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { COLORS } from '@/constants/loginSignin/authStyles';

const DEFAULT_ACTIVE = COLORS.primary;
const DEFAULT_INACTIVE_LINE = '#E5E7EB';
const DEFAULT_INACTIVE_CIRCLE = '#F3F4F6';
const DEFAULT_INACTIVE_TEXT = '#9CA3AF';

function StepConnector({
  index,
  currentStep,
  activeColor,
  inactiveColor,
  partialProgress,
}) {
  const fromStep = index + 1;
  let fillRatio = 0;

  if (currentStep > fromStep) {
    fillRatio = 1;
  } else if (currentStep === fromStep) {
    fillRatio = partialProgress;
  }

  return (
    <View style={[styles.connectorTrack, { backgroundColor: inactiveColor }]}>
      <View
        style={[
          styles.connectorFill,
          { width: `${fillRatio * 100}%`, backgroundColor: activeColor },
        ]}
      />
    </View>
  );
}

function StepCircle({ step, currentStep, activeColor, inactiveCircleColor, inactiveTextColor }) {
  const isActive = step <= currentStep;

  return (
    <View
      style={[
        styles.circle,
        { backgroundColor: isActive ? activeColor : inactiveCircleColor },
      ]}
    >
      <Text style={[styles.circleLabel, { color: isActive ? '#FFFFFF' : inactiveTextColor }]}>
        {step}
      </Text>
    </View>
  );
}

/**
 * Shared step progress — numbered circle stepper (default) or thin bar variants.
 *
 * @example
 * <StepProgressBar currentStep={1} totalSteps={3} />
 * <StepProgressBar currentStep={2} totalSteps={4} variant="segmented" />
 */
export default function StepProgressBar({
  currentStep = 1,
  totalSteps = 3,
  variant = 'stepper',
  activeColor = DEFAULT_ACTIVE,
  inactiveColor = DEFAULT_INACTIVE_LINE,
  inactiveCircleColor = DEFAULT_INACTIVE_CIRCLE,
  inactiveTextColor = DEFAULT_INACTIVE_TEXT,
  showLabel = true,
  partialProgress = 0.35,
  height = 3,
  gap = 3,
  style,
}) {
  const step = Math.max(1, Math.min(currentStep, totalSteps));

  if (variant === 'stepper') {
    return (
      <View style={[styles.stepperContainer, style]}>
        {showLabel ? (
          <Text style={styles.stepLabel}>
            Step {step} of {totalSteps}
          </Text>
        ) : null}

        <View style={styles.stepperRow}>
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNum = index + 1;
            return (
              <React.Fragment key={stepNum}>
                {index > 0 ? (
                  <StepConnector
                    index={index - 1}
                    currentStep={step}
                    activeColor={activeColor}
                    inactiveColor={inactiveColor}
                    partialProgress={partialProgress}
                  />
                ) : null}
                <StepCircle
                  step={stepNum}
                  currentStep={step}
                  activeColor={activeColor}
                  inactiveCircleColor={inactiveCircleColor}
                  inactiveTextColor={inactiveTextColor}
                />
              </React.Fragment>
            );
          })}
        </View>
      </View>
    );
  }

  if (variant === 'continuous') {
    const fillWidth = `${(step / totalSteps) * 100}%`;
    return (
      <View style={[styles.track, { height, backgroundColor: inactiveColor }, style]}>
        <View
          style={[
            styles.barFill,
            { width: fillWidth, height, backgroundColor: activeColor },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.segmentedRow, { gap, height }, style]}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const isFilled = index + 1 <= step;
        return (
          <View
            key={index}
            style={[
              styles.segment,
              { height, backgroundColor: isFilled ? activeColor : inactiveColor },
            ]}
          />
        );
      })}
    </View>
  );
}

const CIRCLE_SIZE = 34;

const styles = StyleSheet.create({
  stepperContainer: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 14,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  connectorTrack: {
    flex: 1,
    height: 2,
    overflow: 'hidden',
  },
  connectorFill: {
    height: '100%',
  },
  segmentedRow: {
    flexDirection: 'row',
    width: '100%',
  },
  segment: {
    flex: 1,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
