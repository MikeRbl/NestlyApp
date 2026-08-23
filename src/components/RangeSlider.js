import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '../theme/colors';

export default function RangeSlider({
  min = 0,
  max = 100000,
  step = 500,
  values = [0, 100000],
  onChange,
  onComplete,
  formatValue = (v) => `$${Number(v).toLocaleString('es-MX')}`,
}) {
  const [low, setLow] = useState(values[0]);
  const [high, setHigh] = useState(values[1]);
  const [activeThumb, setActiveThumb] = useState(null);

  useEffect(() => {
    setLow(values[0]);
    setHigh(values[1]);
  }, [values]);

  const minDistance = (max - min) * 0.01;

  const handleLowChange = (value) => {
    const newLow = Math.min(value, high - minDistance);
    setLow(newLow);
    onChange?.([newLow, high]);
  };

  const handleHighChange = (value) => {
    const newHigh = Math.max(value, low + minDistance);
    setHigh(newHigh);
    onChange?.([low, newHigh]);
  };

  const handleLowComplete = (value) => {
    const newLow = Math.min(value, high - minDistance);
    setLow(newLow);
    onComplete?.([newLow, high]);
    setActiveThumb(null);
  };

  const handleHighComplete = (value) => {
    const newHigh = Math.max(value, low + minDistance);
    setHigh(newHigh);
    onComplete?.([low, newHigh]);
    setActiveThumb(null);
  };

  const lowPercent = ((low - min) / (max - min)) * 100;
  const highPercent = ((high - min) / (max - min)) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.labelsRow}>
        <Text style={styles.label}>{formatValue(low)}</Text>
        <Text style={styles.label}>{formatValue(high)}</Text>
      </View>
      <View style={styles.sliderWrapper}>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={low}
          onValueChange={handleLowChange}
          onSlidingComplete={handleLowComplete}
          onTouchStart={() => setActiveThumb('low')}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.inputBg}
          thumbTintColor={colors.primary}
          thumbTouchSize={{ width: 40, height: 40 }}
        />
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={high}
          onValueChange={handleHighChange}
          onSlidingComplete={handleHighComplete}
          onTouchStart={() => setActiveThumb('high')}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          thumbTintColor={colors.primary}
          thumbTouchSize={{ width: 40, height: 40 }}
        />
        <View
          style={[
            styles.trackHighlight,
            { left: `${lowPercent}%`, right: `${100 - highPercent}%` },
          ]}
        />
      </View>
      <View style={styles.inputsRow}>
        <TouchableOpacity
          style={[styles.inputBox, activeThumb === 'low' && styles.inputBoxActive]}
          onPress={() => setActiveThumb('low')}
        >
          <Text style={styles.inputText}>{formatValue(low)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.inputBox, activeThumb === 'high' && styles.inputBoxActive]}
          onPress={() => setActiveThumb('high')}
        >
          <Text style={styles.inputText}>{formatValue(high)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sliderWrapper: {
    position: 'relative',
    height: 40,
    marginTop: 4,
  },
  slider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  trackHighlight: {
    position: 'absolute',
    top: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    zIndex: 1,
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  inputBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBg,
    alignItems: 'center',
  },
  inputBoxActive: {
    borderColor: colors.primary,
    backgroundColor: '#eef1ff',
  },
  inputText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});