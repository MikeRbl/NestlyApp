import React, { useState, useContext, useEffect, useRef } from 'react';
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
  Animated,
  Image,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

const SLIDESHOW_IMAGES = [
  require('../../assets/login/casa1.jpg'),
  require('../../assets/login/casa2.jpg'),
  require('../../assets/login/casa3.jpg'),
  require('../../assets/login/casa4.jpg'),
];

export default function LoginScreen({ navigation }) {
  const { login, continueAsGuest } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email no válido';
    if (!password) newErrors.password = 'Contraseña es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) {
      Alert.alert('Upsi', 'Completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      Alert.alert('Éxito', 'Iniciaste sesión correctamente');
    } catch (error) {
      if (error.status === 403) {
        const message = error.error?.message || '';
        if (message.includes('suspendida')) {
          Alert.alert('Cuenta Suspendida', 'Tu cuenta está suspendida. Intenta más tarde.');
        } else if (message.includes('baneada')) {
          Alert.alert('Cuenta Baneada', 'Tu cuenta ha sido baneada permanentemente.');
        }
      } else {
        Alert.alert(
          'Error en el inicio de sesión',
          error.error?.message || 'Credenciales incorrectas. Intenta de nuevo.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const continueWithoutAccount = async () => {
    await continueAsGuest();
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

          <Text style={styles.title}>Iniciar sesión</Text>

          <View style={styles.formField}>
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <SvgIcon type="user" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Correo"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.formField}>
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <SvgIcon type="lock" />
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Contraseña"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <SvgIcon type={showPassword ? 'eyeOff' : 'eye'} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <View style={styles.links}>
            <TouchableOpacity>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
              <Text style={styles.registerText}>Registrarse</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.guestLink} onPress={continueWithoutAccount}>
            <Text style={styles.guestText}>Continuar sin una cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SvgIcon({ type, size = 20, color = '#999' }) {
  const s = { width: size, height: size };
  switch (type) {
    case 'user':
      return (
        <View style={s}>
          <Text style={{ color, fontSize: 16 }}>👤</Text>
        </View>
      );
    case 'lock':
      return (
        <View style={s}>
          <Text style={{ color, fontSize: 16 }}>🔒</Text>
        </View>
      );
    case 'eye':
      return (
        <View style={s}>
          <Text style={{ color, fontSize: 16 }}>👁</Text>
        </View>
      );
    case 'eyeOff':
      return (
        <View style={s}>
          <Text style={{ color, fontSize: 16 }}>🙈</Text>
        </View>
      );
    default:
      return null;
  }
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
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 2,
  },
  submitBtn: {
    width: '100%',
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    fontSize: 14,
  },
  forgotText: {
    color: '#666',
    fontSize: 14,
  },
  registerText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  guestLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  guestText: {
    color: '#666',
    fontSize: 14,
  },
});
