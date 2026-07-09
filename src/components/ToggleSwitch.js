import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function ToggleSwitch({ label, value, onChange, options = ['Sí', 'No'], activeValues = [true, false] }) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.switchContainer}>
        {options.map((option, index) => {
          const isActive = value === activeValues[index];
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onChange(activeValues[index])}
              style={[styles.button, isActive && styles.activeButton]}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, isActive && styles.activeButtonText]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  switchContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 2,
    width: 112,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeButton: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
});
