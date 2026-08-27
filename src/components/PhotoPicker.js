import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';

export default function PhotoPicker({
  photos = [],
  onPhotosChange,
  error,
  touched,
  maxPhotos = 5,
}) {
  const [permissionError, setPermissionError] = useState('');
  const isWeb = Platform.OS === 'web';

  const remaining = maxPhotos - photos.length;
  const showError = error && touched;

  async function verifyPermission(type) {
    let permission;
    if (type === 'camera') {
      permission = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    return permission.status === 'granted';
  }

  function normalizeMime(asset) {
    const rawType = asset.type || asset.mimeType;
    if (rawType && rawType.includes('/')) return rawType;
    const ext = (asset.fileName || asset.uri || '').split('.').pop()?.toLowerCase() || '';
    const map = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      heic: 'image/heic',
      mp4: 'video/mp4',
    };
    return map[ext] || 'image/jpeg';
  }

  function normalizeAssets(assets) {
    return assets.map((asset) => ({
      uri: asset.uri,
      fileName: asset.fileName || asset.uri.split('/').pop(),
      type: normalizeMime(asset),
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
    }));
  }

  async function takePhoto() {
    setPermissionError('');
    const hasPermission = await verifyPermission('camera');
    if (!hasPermission) {
      setPermissionError('Se requieren permisos para usar la cámara.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = normalizeAssets(result.assets);
      const combined = [...photos, ...newPhotos].slice(0, maxPhotos);
      onPhotosChange(combined);
    }
  }

  async function pickFromGallery() {
    setPermissionError('');
    const hasPermission = await verifyPermission('gallery');
    if (!hasPermission) {
      setPermissionError('Se requieren permisos para acceder a la galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = normalizeAssets(result.assets);
      const combined = [...photos, ...newPhotos].slice(0, maxPhotos);
      onPhotosChange(combined);
    }
  }

  function removePhoto(index) {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  }

  function renderErrorMessage() {
    if (!showError && !permissionError) return null;
    const message = permissionError
      || (error === 'required' || error === 'minPhotos'
        ? 'Debes subir al menos 1 imagen.'
        : error === 'maxPhotos'
          ? `No puedes subir más de ${maxPhotos} imágenes.`
          : error);
    return <Text style={styles.errorText}>{message}</Text>;
  }

  function renderButtons() {
    const disabled = photos.length >= maxPhotos;
    if (isWeb) {
      return (
        <TouchableOpacity
          style={[styles.button, styles.fullWidthButton, disabled && styles.buttonDisabled]}
          onPress={pickFromGallery}
          activeOpacity={0.8}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>Seleccionar imágenes</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={takePhoto}
          activeOpacity={0.8}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>Cámara</Text>
        </TouchableOpacity>
        <View style={styles.buttonSpacer} />
        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={pickFromGallery}
          activeOpacity={0.8}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>Galería</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderPhoto({ item, index }) {
    return (
      <View style={styles.photoContainer}>
        <Image source={{ uri: item.uri }} style={styles.photo} />
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removePhoto(index)}
          activeOpacity={0.8}
        >
          <Text style={styles.removeButtonText}>X</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderButtons()}
      {renderErrorMessage()}
      {photos.length > 0 ? (
        <FlatList
          horizontal
          data={photos}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderPhoto}
          contentContainerStyle={styles.listContent}
          showsHorizontalScrollIndicator={false}
        />
      ) : null}
      <Text style={styles.counterText}>
        {`${photos.length} de ${maxPhotos} fotos`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  fullWidthButton: {
    flex: 1,
  },
  buttonSpacer: {
    width: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
  },
  listContent: {
    paddingVertical: 12,
  },
  photoContainer: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  counterText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
