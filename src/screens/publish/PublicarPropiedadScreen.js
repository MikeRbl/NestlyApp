import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Formulario from '../../components/Formulario';
import { colors } from '../../theme/colors';

export default function PublicarPropiedadScreen() {
  const { user, isGuest, exitGuestMode } = useAuth();
  const navigation = useNavigation();

  if (isGuest) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Publicar una propiedad</Text>
          <Text style={styles.description}>
            Para publicar una propiedad debes iniciar sesión o crear una cuenta.
          </Text>
          <TouchableOpacity
            style={[styles.btn, styles.primaryBtn]}
            activeOpacity={0.8}
            onPress={() => exitGuestMode('login')}
          >
            <Text style={styles.primaryBtnText}>Iniciar Sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.secondaryBtn]}
            activeOpacity={0.8}
            onPress={() => exitGuestMode('register')}
          >
            <Text style={styles.secondaryBtnText}>Crear Cuenta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Explorar')}
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Formulario
      onClose={() => navigation.navigate('Explorar')}
      user={user}
      navigation={navigation}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});