import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';

export default function SelectModal({
  label,
  options = [],
  selectedValue,
  onSelect,
  placeholder = 'Selecciona',
  error,
  touched,
}) {
  const [visible, setVisible] = useState(false);

  const selectedLabel = options.find((opt) => String(opt.value) === String(selectedValue))?.label || placeholder;
  const showError = error && touched;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.button, showError && styles.buttonError]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, selectedValue === '' && styles.placeholderText]}>
          {selectedLabel}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      {showError && <Text style={styles.errorText}>{error.message || 'Requerido.'}</Text>}

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{label || 'Seleccionar'}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    String(item.value) === String(selectedValue) && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      String(item.value) === String(selectedValue) && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buttonError: {
    borderColor: colors.error,
  },
  buttonText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBg,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionSelected: {
    backgroundColor: colors.inputBg,
  },
  optionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: colors.inputBg,
    marginHorizontal: 16,
  },
});
