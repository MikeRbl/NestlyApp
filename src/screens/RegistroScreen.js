import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { publicPost } from '../services/api';

const SLIDESHOW_IMAGES = [
  require('../../assets/login/casa1.jpg'),
  require('../../assets/login/casa2.jpg'),
  require('../../assets/login/casa3.jpg'),
  require('../../assets/login/casa4.jpg'),
];

export default function RegistroScreen({ navigation }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name_paternal: '',
    last_name_maternal: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    terminos: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showTerminos, setShowTerminos] = useState(false);
  const [showPrivacidad, setShowPrivacidad] = useState(false);

  const fadeAnim = useRef([
    new Animated.Value(1),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const currentIndex = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (currentIndex.current + 1) % 4;
      Animated.sequence([
        Animated.timing(fadeAnim[currentIndex.current], {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim[next], {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start();
      currentIndex.current = next;
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: null });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.first_name) newErrors.first_name = 'El nombre es requerido';
    if (!form.last_name_paternal) newErrors.last_name_paternal = 'El apellido paterno es requerido';
    if (!form.last_name_maternal) newErrors.last_name_maternal = 'El apellido materno es requerido';
    if (!form.email) newErrors.email = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'El formato del correo no es válido';
    if (!form.phone) newErrors.phone = 'El teléfono es requerido';
    else if (!/^[0-9]{10}$/.test(form.phone)) newErrors.phone = 'Debe ser un número de 10 dígitos';
    if (!form.password) newErrors.password = 'La contraseña es requerida';
    else if (form.password.length < 6) newErrors.password = 'Debe tener al menos 6 caracteres';
    if (form.password !== form.password_confirmation) newErrors.password_confirmation = 'Las contraseñas no coinciden';
    if (!form.terminos) newErrors.terminos = 'Debes aceptar los términos';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) {
      Alert.alert('Formulario incompleto', 'Por favor, completa todos los campos requeridos correctamente.');
      return;
    }
    setLoading(true);
    try {
      await publicPost('register', form);
      Alert.alert('¡Registro exitoso!', 'Serás redirigido para iniciar sesión.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert(
        'Error en el registro',
        error.error?.message || error.error?.errors?.email?.[0] || 'Ocurrió un error. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {SLIDESHOW_IMAGES.map((img, i) => (
        <Animated.Image
          key={i}
          source={img}
          style={[styles.slide, { opacity: fadeAnim[i] }]}
          resizeMode="cover"
        />
      ))}
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/navbar/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Crear una cuenta</Text>

          <View style={styles.formField}>
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Text style={styles.iconText}>👤</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Nombre(s)"
                placeholderTextColor="#999"
                value={form.first_name}
                onChangeText={(v) => handleChange('first_name', v)}
              />
            </View>
            {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
          </View>

          <View style={styles.formRow}>
            <View style={styles.halfField}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Text style={styles.iconText}>👤</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Apellido Paterno"
                  placeholderTextColor="#999"
                  value={form.last_name_paternal}
                  onChangeText={(v) => handleChange('last_name_paternal', v)}
                />
              </View>
              {errors.last_name_paternal && <Text style={styles.errorText}>{errors.last_name_paternal}</Text>}
            </View>
            <View style={styles.halfField}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Text style={styles.iconText}>👤</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Apellido Materno"
                  placeholderTextColor="#999"
                  value={form.last_name_maternal}
                  onChangeText={(v) => handleChange('last_name_maternal', v)}
                />
              </View>
              {errors.last_name_maternal && <Text style={styles.errorText}>{errors.last_name_maternal}</Text>}
            </View>
          </View>

          <View style={styles.formField}>
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Text style={styles.iconText}>✉️</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#999"
                value={form.email}
                onChangeText={(v) => handleChange('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.formRow}>
            <View style={styles.halfField}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Text style={styles.iconText}>🔒</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  value={form.password}
                  onChangeText={(v) => handleChange('password', v)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Text style={styles.toggleIcon}>{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>
            <View style={styles.halfField}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Text style={styles.iconText}>🔒</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#999"
                  value={form.password_confirmation}
                  onChangeText={(v) => handleChange('password_confirmation', v)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                >
                  <Text style={styles.toggleIcon}>{showConfirmPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password_confirmation && <Text style={styles.errorText}>{errors.password_confirmation}</Text>}
            </View>
          </View>

          <View style={styles.formField}>
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Text style={styles.iconText}>📞</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                placeholderTextColor="#999"
                value={form.phone}
                onChangeText={(v) => handleChange('phone', v)}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <TouchableOpacity
            style={styles.terminosRow}
            onPress={() => handleChange('terminos', !form.terminos)}
          >
            <View style={[styles.checkbox, form.terminos && styles.checkboxChecked]}>
              {form.terminos && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.terminosText}>
              Acepto los{' '}
              <Text style={styles.terminosLink} onPress={() => setShowTerminos(true)}>
                Términos y Condiciones
              </Text>{' '}
              y la{' '}
              <Text style={styles.terminosLink} onPress={() => setShowPrivacidad(true)}>
                Política de Privacidad
              </Text>.
            </Text>
          </TouchableOpacity>
          {errors.terminos && <Text style={styles.errorText}>{errors.terminos}</Text>}

          <TouchableOpacity
            style={[styles.submitBtn, (loading || !form.terminos) && styles.submitBtnDisabled]}
            onPress={onSubmit}
            disabled={loading || !form.terminos}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Registrarse</Text>
            )}
          </TouchableOpacity>

          <View style={styles.linksCenter}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>¿Ya tienes cuenta? Inicia Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showTerminos} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Términos y Condiciones</Text>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>
                1. Definición del Servicio{'\n\n'}
                Nestly es una plataforma en línea que permite a los propietarios ("Anfitriones") publicar
                propiedades ("Anuncios") para alquilar, y a los usuarios ("Huéspedes") buscar y reservar
                dichas propiedades.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowTerminos(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPrivacidad} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Política de Privacidad</Text>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>
                1. Información que Recopilamos{'\n\n'}
                Recopilamos tres categorías principales de información: Información que tú nos proporcionas
                (datos de cuenta, perfil, propiedades, pago), Información recopilada automáticamente
                (datos de uso, geolocalización, cookies) e Información de Terceros (reseñas, verificaciones).
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPrivacidad(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
  },
  slide: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 140,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  formField: {
    marginBottom: 15,
  },
  formRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  halfField: {
    flex: 1,
  },
  inputGroup: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  iconText: {
    fontSize: 16,
  },
  input: {
    width: '100%',
    padding: 12,
    paddingLeft: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    fontSize: 14,
    color: '#333',
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  toggleIcon: {
    fontSize: 16,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 2,
  },
  terminosRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 5,
    marginBottom: 5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 6,
    marginRight: 10,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  terminosText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  terminosLink: {
    color: '#2563eb',
    fontWeight: '500',
  },
  submitBtn: {
    width: '100%',
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 15,
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  linksCenter: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginLink: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    padding: 20,
    paddingBottom: 10,
  },
  modalBody: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  modalCloseBtn: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '500',
  },
});
