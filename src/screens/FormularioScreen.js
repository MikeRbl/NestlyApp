import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { serviceGet, servicePut, servicePost } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

export default function FormularioScreen({ navigation, onClose }) {
  const { user, logout, loadUser } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formChanges, setFormChanges] = useState({});
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await serviceGet('user');
      if (response && response.user) {
        const imgUrl = response.user.avatar_url || response.user.profile_picture;
        if (imgUrl) {
          response.user.profile_picture = `${imgUrl}?${new Date().getTime()}`;
        }
        setUserData(response.user);
      }
    } catch (err) {
      setErrorMessage(err.error?.message || 'Error al cargar los datos del usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormChanges({ ...formChanges, [field]: value });
    setSuccessMessage('');
    setErrorMessage('');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const file = result.assets[0];
      if (file.fileSize > 5 * 1024 * 1024) {
        setErrorMessage('La imagen es demasiado grande (máximo 5MB).');
        return;
      }
      setSelectedImage(file.uri);
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const uploadProfilePicture = async () => {
    if (!selectedFile) return;
    setUploadingImage(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'image/jpeg',
        name: selectedFile.fileName || 'avatar.jpg',
      });
      const response = await servicePost('user/avatar', formData);
      if (userData && response.avatar_url) {
        setUserData({
          ...userData,
          profile_picture: `${response.avatar_url}?${new Date().getTime()}`,
        });
      }
      setSelectedImage(null);
      setSelectedFile(null);
      Alert.alert('Éxito', 'Foto de perfil actualizada.');
    } catch (err) {
      setErrorMessage(err.error?.message || 'Error al actualizar la foto de perfil.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setErrorMessage('');
  };

  const onSubmit = async () => {
    if (!userData) {
      setErrorMessage('No se pudieron cargar los datos del usuario.');
      return;
    }
    if (Object.keys(formChanges).length === 0 && !password) {
      Alert.alert('Info', 'No hay cambios para guardar.');
      return;
    }
    if (password && password !== passwordConfirmation) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (password && password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const updateData = { ...formChanges };
      if (password) {
        updateData.password = password;
        updateData.password_confirmation = passwordConfirmation;
      }
      
      await servicePut('user', updateData);
      
      setSuccessMessage('Perfil actualizado correctamente.');
      setUserData({ ...userData, ...formChanges });
      setFormChanges({});
      setPassword('');
      setPasswordConfirmation('');
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (error) {
      // 🔥 LOGS AÑADIDOS AQUÍ PARA DIAGNÓSTICO EXACTO
      console.log('💥 ERROR 422 COMPLETO:', JSON.stringify(error, null, 2));

      if (error.status === 422) {
        const errs = error.error?.errors || error.errors;
        console.log('❌ CAMPOS RECHAZADOS POR LARAVEL:', errs);
        
        if (typeof errs === 'object') {
          setErrorMessage(Object.values(errs).flat().join('; '));
        }
      } else if (error.status === 401) {
        Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Inicia sesión de nuevo.', [
          { text: 'OK', onPress: () => { logout(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); } },
        ]);
      } else {
        setErrorMessage(error.error?.message || 'Error al actualizar el perfil.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361ee" />
        <Text style={styles.loadingText}>Cargando datos del usuario...</Text>
      </View>
    );
  }

  const profileImage = selectedImage || userData?.profile_picture;

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onClose ? onClose() : navigation.goBack()}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <View style={styles.avatarWrapper}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderIcon}>👤</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Text style={styles.uploadBtnText}>
                {selectedFile ? 'Cambiar foto' : 'Subir foto'}
              </Text>
            </TouchableOpacity>
            {selectedFile && (
              <TouchableOpacity
                style={styles.savePhotoBtn}
                onPress={uploadProfilePicture}
                disabled={uploadingImage}
              >
                <Text style={styles.savePhotoBtnText}>
                  {uploadingImage ? 'Guardando...' : 'Guardar foto'}
                </Text>
              </TouchableOpacity>
            )}
            {errorMessage && selectedFile ? (
              <View style={styles.errorAlert}>
                <Text style={styles.errorAlertText}>{errorMessage}</Text>
              </View>
            ) : null}
            <Text style={styles.userName}>
              {userData?.first_name || 'Usuario'} {userData?.last_name_paternal || ''}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{userData?.role || 'Usuario'}</Text>
            </View>
          </View>

          <View style={styles.navItems}>
            <TouchableOpacity style={styles.navItem} onPress={() => onClose ? onClose() : navigation.goBack()}>
              <Text style={styles.navItemText}>Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
              <Text style={[styles.navItemText, styles.navItemTextActive]}>Editar Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navItem, styles.logoutItem]} onPress={handleLogout}>
              <Text style={[styles.navItemText, styles.logoutText]}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {errorMessage && !selectedFile ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>{errorMessage}</Text>
            </View>
          ) : null}
          {successMessage ? (
            <View style={styles.successAlert}>
              <Text style={styles.successAlertText}>{successMessage}</Text>
            </View>
          ) : null}

          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Editar Perfil</Text>
            <Text style={styles.formDesc}>Actualiza tu información personal</Text>
          </View>

          {userData && (
            <>
              <View style={styles.formGrid}>
                <FormField
                  label="Nombre"
                  value={userData.first_name}
                  onChangeText={(v) => {
                    setUserData({ ...userData, first_name: v });
                    handleFieldChange('first_name', v);
                  }}
                />
                <FormField
                  label="Apellido Paterno"
                  value={userData.last_name_paternal}
                  onChangeText={(v) => {
                    setUserData({ ...userData, last_name_paternal: v });
                    handleFieldChange('last_name_paternal', v);
                  }}
                />
                <FormField
                  label="Apellido Materno"
                  value={userData.last_name_maternal}
                  onChangeText={(v) => {
                    setUserData({ ...userData, last_name_maternal: v });
                    handleFieldChange('last_name_maternal', v);
                  }}
                />
                <FormField
                  label="Correo Electrónico"
                  value={userData.email}
                  onChangeText={(v) => {
                    setUserData({ ...userData, email: v });
                    handleFieldChange('email', v);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <FormField
                  label="Teléfono"
                  value={userData.phone}
                  onChangeText={(v) => {
                    setUserData({ ...userData, phone: v });
                    handleFieldChange('phone', v);
                  }}
                  keyboardType="phone-pad"
                />
                <FormField
                  label="Nueva Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Deja en blanco para no cambiar"
                  secureTextEntry
                />
                {password ? (
                  <FormField
                    label="Confirmar Contraseña"
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    placeholder="Repite la nueva contraseña"
                    secureTextEntry
                  />
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                onPress={onSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize, secureTextEntry }) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { padding: 16 },
  container: { gap: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loadingText: { marginTop: 10, color: '#8d99ae' },

  sidebar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtnText: { color: '#8d99ae', fontSize: 14 },
  userInfo: { alignItems: 'center', marginBottom: 20 },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 10,
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e4fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderIcon: { fontSize: 30 },
  uploadBtn: { marginTop: 6 },
  uploadBtnText: { color: '#4361ee', fontSize: 13, fontWeight: '500' },
  savePhotoBtn: { marginTop: 6 },
  savePhotoBtnText: { color: '#16a34a', fontSize: 13, fontWeight: '500' },
  userName: { fontSize: 16, fontWeight: '600', color: '#2b2d42', textAlign: 'center', marginTop: 10 },
  roleBadge: {
    backgroundColor: '#e0e4fc',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  roleBadgeText: { color: '#4361ee', fontSize: 11, fontWeight: '500', textTransform: 'uppercase' },
  navItems: { gap: 6 },
  navItem: { padding: 12, borderRadius: 8 },
  navItemActive: { backgroundColor: '#4361ee' },
  navItemText: { color: '#8d99ae', fontWeight: '500', fontSize: 14 },
  navItemTextActive: { color: '#fff' },
  logoutItem: { marginTop: 10 },
  logoutText: { color: '#ef233c' },

  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formHeader: { marginBottom: 24 },
  formTitle: { fontSize: 22, fontWeight: '700', color: '#2b2d42' },
  formDesc: { color: '#8d99ae', fontSize: 14, marginTop: 4 },
  formGrid: { gap: 16 },
  formGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: '#2b2d42' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  saveBtn: {
    backgroundColor: '#4361ee',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnDisabled: { backgroundColor: '#ccc' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorAlert: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorAlertText: { color: '#c62828', fontSize: 13 },
  successAlert: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successAlertText: { color: '#2e7d32', fontSize: 13 },
});
