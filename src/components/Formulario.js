import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { colors } from '../theme/colors';
import { crearPropiedad, actualizarPropiedad, getTiposDePropiedad, MEDIA_URL } from '../services/api';
import ToggleSwitch from './ToggleSwitch';
import SelectModal from './SelectModal';
import PhotoPicker from './PhotoPicker';

const TOTAL_STEPS = 3;
const GEOCODE_DEBOUNCE_MS = 700;
// Nominatim (OSM) bloquea peticiones anónimas con 403. Identificamos la app.
const NOMINATIM_HEADERS = {
  'User-Agent': 'NestlyApp/1.0 (contacto@nestlyapp.com)',
  'Referer': 'https://nestlyapp.com',
  'Accept': 'application/json',
};
// Límite del backend: 2048 KB por imagen. Dejamos margen de seguridad.
const MAX_FOTO_BYTES = 1.9 * 1024 * 1024;
const INT_FIELDS = ['habitaciones', 'banos', 'metros_cuadrados'];

const ESTADOS_MEXICO = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de México',
  'Coahuila',
  'Colima',
  'Durango',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'México',
  'Michoacán',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatán',
  'Zacatecas',
];

function FormInput({ label, error, children }) {
  return (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.label}>{label}</Text>}
      {children}
      {error && <Text style={styles.errorText}>{error.message}</Text>}
    </View>
  );
}

function fotoUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const separator = path.startsWith('/') ? '' : '/';
  return `${MEDIA_URL}/storage${separator}${path}`;
}

function normalizeMimeType(file) {
  const rawType = file?.type || file?.mimeType;
  if (rawType && rawType.includes('/')) return rawType;
  const ext = (file?.fileName || file?.uri || '').split('.').pop()?.toLowerCase() || '';
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

export default function Formulario({ onClose, user, navigation, initialData, onSuccess }) {
  const isEdit = !!initialData;
  const [currentStep, setCurrentStep] = useState(1);
  const [tiposDePropiedad, setTiposDePropiedad] = useState([]);
  const [isLoadingTipos, setIsLoadingTipos] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const initialValues = useMemo(() => ({
    titulo: initialData?.titulo || '',
    descripcion: initialData?.descripcion || '',
    direccion: initialData?.direccion || '',
    pais: initialData?.pais || 'México',
    estado_ubicacion: initialData?.estado_ubicacion || '',
    ciudad: initialData?.ciudad || '',
    colonia: initialData?.colonia || '',
    precio: initialData?.precio != null ? String(initialData.precio) : '',
    habitaciones: initialData?.habitaciones != null ? String(initialData.habitaciones) : '',
    banos: initialData?.banos != null ? String(initialData.banos) : '',
    metros_cuadrados: initialData?.metros_cuadrados != null ? String(initialData.metros_cuadrados) : '',
    deposito: initialData?.deposito != null && Number(initialData.deposito) > 0 ? String(initialData.deposito) : '',
    amueblado: !!initialData?.amueblado,
    anualizado: !!initialData?.anualizado,
    mascotas: initialData
      ? !!(initialData.mascotas === true || initialData.mascotas === 'si' || Number(initialData.mascotas) === 1)
      : '',
    tipo_propiedad_id: initialData?.tipo_propiedad_id != null ? String(initialData.tipo_propiedad_id) : '',
    fotos: [],
    telefono: initialData?.telefono || '',
  }), [initialData]);

  const [existingFotos, setExistingFotos] = useState(
    Array.isArray(initialData?.fotos)
      ? initialData.fotos.filter((f) => typeof f === 'string')
      : []
  );

  const removeExistingFoto = (path) => {
    setExistingFotos((prev) => prev.filter((p) => p !== path));
  };

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: initialValues,
  });

  const watchedFields = watch(['direccion', 'colonia', 'ciudad', 'estado_ubicacion', 'pais']);

  useEffect(() => {
    let isMounted = true;
    async function loadTipos() {
      try {
        const data = await getTiposDePropiedad();
        if (isMounted) {
          setTiposDePropiedad(Array.isArray(data) ? data : data?.data || []);
        }
      } catch {
        Toast.show({
          type: 'error',
          text1: 'No se pudieron cargar las categorías de propiedad.',
        });
      } finally {
        if (isMounted) setIsLoadingTipos(false);
      }
    }
    loadTipos();
    return () => {
      isMounted = false;
    };
  }, []);

  const geocodeLatLng = useCallback(async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, { headers: NOMINATIM_HEADERS });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.address) {
        const address = data.address;
        setValue('direccion', data.name || data.display_name || '', { shouldValidate: false });
        setValue('pais', address.country || '', { shouldValidate: false });
        setValue('estado_ubicacion', address.state || address.state_district || '', { shouldValidate: false });
        setValue('ciudad', address.city || address.town || address.village || '', { shouldValidate: false });
        setValue('colonia',
          address.suburb ||
          address.neighbourhood ||
          address.quarter ||
          address.city_district ||
          address.residential ||
          address.hamlet ||
          '', { shouldValidate: false });
      } else {
        Toast.show({
          type: 'info',
          text1: 'No se encontraron detalles para la ubicación.',
        });
      }
    } catch (error) {
      console.warn('Error al geocodificar (reverse):', error);
      Toast.show({
        type: 'error',
        text1: `Error en geocodificación: ${error.message}`,
      });
    }
  }, [setValue]);

  const geocodeAddress = useCallback(async (address) => {
    if (!address) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
      const response = await fetch(url, { headers: NOMINATIM_HEADERS });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        await geocodeLatLng(lat, lon);
      } else {
        Toast.show({
          type: 'info',
          text1: 'Dirección no encontrada. Intenta ser más específico.',
        });
      }
    } catch (error) {
      console.warn('Error en geocodificación directa:', error);
      Toast.show({
        type: 'error',
        text1: `Error al buscar en mapa: ${error.message}`,
      });
    }
  }, [setValue, geocodeLatLng]);

  useEffect(() => {
    if (isEdit) return;

    const [direccion, colonia, ciudad, estado_ubicacion, pais] = watchedFields;
    const fullAddressQuery = [direccion, colonia, ciudad, estado_ubicacion, pais]
      .filter((part) => part && part.trim() !== '')
      .join(', ');

    // Solo geocodificar si hay al menos una parte de ubicación específica
    // (evita golpear Nominatim con consultas triviales como solo el país).
    const hasMeaningfulPart = [direccion, colonia, ciudad, estado_ubicacion]
      .some((part) => part && part.trim().length >= 3);

    if (!hasMeaningfulPart || fullAddressQuery.length <= 5) return;

    const timer = setTimeout(() => {
      geocodeAddress(fullAddressQuery);
    }, GEOCODE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [watchedFields, geocodeAddress, isEdit]);

  async function useCurrentLocation() {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Se requieren permisos de ubicación.',
        });
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      await geocodeLatLng(latitude, longitude);
    } catch (error) {
      console.warn('Error obteniendo ubicación:', error);
      Toast.show({
        type: 'error',
        text1: 'No se pudo obtener la ubicación actual.',
      });
    } finally {
      setIsGettingLocation(false);
    }
  }

  const stepFields = {
    1: ['titulo', 'descripcion', 'tipo_propiedad_id', 'precio', 'habitaciones', 'banos', 'metros_cuadrados', 'mascotas', 'telefono'],
    2: ['pais', 'estado_ubicacion', 'ciudad', 'colonia', 'direccion'],
    3: ['fotos'],
  };

  async function handleNext() {
    const valid = await trigger(stepFields[currentStep]);
    if (valid) setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }

  function handlePrevious() {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  const onSubmit = async (formValues) => {
    console.log('🚀 1. Entrando a onSubmit');

    const fotosNuevas = formValues.fotos || [];
    const totalFotos = (isEdit ? existingFotos.length : 0) + fotosNuevas.length;
    if (totalFotos < 1) {
      Toast.show({ type: 'error', text1: 'Debes subir al menos 1 imagen.' });
      return;
    }
    if (totalFotos > 5) {
      Toast.show({ type: 'error', text1: 'No puedes subir más de 5 imágenes.' });
      return;
    }

    const oversized = fotosNuevas.filter((f) => f.fileSize && f.fileSize > MAX_FOTO_BYTES);
    if (oversized.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Imágenes demasiado grandes',
        text2: `${oversized.map((f) => f.fileName).join(', ')} supera el límite de 2MB por foto. Elige otra o reduce su tamaño.`,
        visibilityTime: 6000,
      });
      return;
    }

    console.log('📸 Fotos a subir:', fotosNuevas.map((f) => ({
      name: f.fileName || f.uri?.split('/').pop(),
      uri: f.uri,
      type: f.type,
      fileSize: f.fileSize ?? 'DESCONOCIDO',
    })));

    async function uriToFile(uri, fileName, type) {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new File([blob], fileName, { type });
    }

    try {
      console.log('⏳ 2. Construyendo FormData...');
      const formData = new FormData();

      Object.entries(formValues).forEach(([key, value]) => {
        // Ignoramos las fotos aquí, las procesamos más abajo
        if (key === 'fotos') return;
        // Ignoramos valores vacíos
        if (value === null || value === undefined || value === '') return;
        
        let finalValue = value;
        
        // 🔥 BLINDAJE DEFINITIVO: Interceptamos 'mascotas' sin importar cómo llegue
        if (key === 'mascotas') {
          finalValue = (value === 'si' || value === true) ? '1' : '0';
        } 
        // 🔥 Convertimos el resto de booleanos (amueblado, anualizado)
        else if (typeof finalValue === 'boolean') {
          finalValue = finalValue ? '1' : '0';
        }

        if (INT_FIELDS.includes(key)) {
          const parsed = Math.round(parseFloat(finalValue));
          if (Number.isNaN(parsed)) return;
          formData.append(key, String(parsed));
          return;
        }
        
        formData.append(key, String(finalValue));
      });

      if (user?.email) {
        formData.append('email', user.email);
      }

      if (isEdit) {
        formData.append('existing_fotos', JSON.stringify(existingFotos));
      }

      // Procesamiento de imágenes nuevas (Web vs Móvil)
      if (Platform.OS === 'web') {
        for (const file of fotosNuevas) {
          const fileObj = await uriToFile(
            file.uri,
            file.fileName || file.uri.split('/').pop(),
            normalizeMimeType(file) || file.type || 'image/jpeg'
          );
          if (fileObj.size > MAX_FOTO_BYTES) {
            throw new Error(`La imagen "${fileObj.name}" supera el límite de 2MB. Elige otra o reduce su tamaño.`);
          }
          formData.append('fotos[]', fileObj);
        }
      } else {
        fotosNuevas.forEach((file) => {
          formData.append('fotos[]', {
            uri: file.uri,
            type: normalizeMimeType(file) || file.type || 'image/jpeg',
            name: file.fileName || file.uri.split('/').pop(),
          });
        });
      }

      console.log('🌐 3. Llamando a crearPropiedad()...');

      const respuesta = isEdit
        ? await actualizarPropiedad(initialData.id ?? initialData.id_propiedad, formData)
        : await crearPropiedad(formData);

      console.log('✅ 4. Operación exitosa en backend:', respuesta);

      Toast.show({
        type: 'success',
        text1: isEdit ? '¡Propiedad actualizada correctamente!' : '¡Propiedad publicada correctamente!',
      });

      onSuccess?.();

      // Limpieza y redirección
      reset(isEdit ? initialValues : undefined);
      setCurrentStep(1);
      if (onClose) {
        onClose();
      } else if (navigation?.navigate) {
        navigation.navigate('Explorar');
      }
      
    } catch (err) {
      console.error('💥 5. ERROR FATAL AL PUBLICAR:', err);
      
      if (err.status === 422 && err.errors) {
        const messages = Object.values(err.errors).flat().join('\n');
        Toast.show({
          type: 'error',
          text1: 'Error de validación',
          text2: messages,
          visibilityTime: 6000,
        });
      } else if (err.status === 413) {
        Toast.show({
          type: 'error',
          text1: 'Imágenes demasiado grandes',
          text2: 'Reduce el tamaño o la cantidad de fotos e intenta de nuevo.',
          visibilityTime: 6000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: err.message || `Error ${err.status || ''}`.trim() || 'Ocurrió un error inesperado.',
        });
      }
    }
  };

  function renderHeader() {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEdit ? 'Editar Propiedad' : 'Publicar Propiedad'}</Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderProgress() {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={[
              styles.progressDot,
              currentStep >= step && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
    );
  }

  function renderStep1() {
    return (
      <View>
        <Text style={styles.stepTitle}>Paso 1 de 3: Información básica</Text>

        <Controller
          control={control}
          name="titulo"
          rules={{
            required: 'El título es obligatorio.',
            maxLength: { value: 255, message: 'Máximo 255 caracteres.' },
          }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <FormInput label="Título de la Propiedad" error={error}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Ej. Casa en San Miguel de Allende"
                placeholderTextColor={colors.textSecondary}
              />
            </FormInput>
          )}
        />

        <Controller
          control={control}
          name="descripcion"
          rules={{ required: 'La descripción es obligatoria.' }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <FormInput label="Descripción" error={error}>
              <TextInput
                style={[styles.input, styles.textArea, error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Describe la propiedad"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </FormInput>
          )}
        />

          <Controller
          control={control}
          name="tipo_propiedad_id"
          rules={{ required: 'Selecciona un tipo de propiedad.' }}
          render={({ field: { value }, fieldState: { error } }) => {
            const tiposUnicos = tiposDePropiedad.filter((tipo, index, self) =>
              index === self.findIndex((t) => t.nombre === tipo.nombre)
            );

            return (
              <SelectModal
                label="Tipo de Propiedad"
                placeholder="Selecciona"
                options={tiposUnicos.map((tipo) => ({
                  label: tipo.nombre,
                  value: String(tipo.id),
                }))}
                selectedValue={value}
                onSelect={(selected) => setValue('tipo_propiedad_id', selected, { shouldValidate: true })}
                error={error}
                touched
              />
            );
          }}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Controller
              control={control}
              name="precio"
              rules={{ required: 'Requerido.', min: { value: 0, message: 'Inválido.' } }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormInput label="Precio (MXN)" error={error}>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </FormInput>
              )}
            />
          </View>
          <View style={styles.half}>
            <Controller
              control={control}
              name="deposito"
              rules={{ min: { value: 0, message: 'Inválido.' } }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormInput label="Depósito (opcional)" error={error}>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </FormInput>
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.third}>
            <Controller
              control={control}
              name="habitaciones"
              rules={{ required: 'Req.', min: { value: 1, message: 'Inv.' } }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormInput label="Hab." error={error}>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </FormInput>
              )}
            />
          </View>
          <View style={styles.third}>
            <Controller
              control={control}
              name="banos"
              rules={{ required: 'Req.', min: { value: 1, message: 'Inv.' } }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormInput label="Baños" error={error}>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </FormInput>
              )}
            />
          </View>
          <View style={styles.third}>
            <Controller
              control={control}
              name="metros_cuadrados"
              rules={{ required: 'Req.', min: { value: 1, message: 'Inv.' } }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormInput label="m²" error={error}>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </FormInput>
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="amueblado"
          render={({ field: { value, onChange } }) => (
            <ToggleSwitch label="Amueblado" value={value} onChange={onChange} />
          )}
        />

        <Controller
          control={control}
          name="mascotas"
          rules={{
            validate: (value) =>
              value === true || value === false
                ? true
                : 'Indica si se aceptan mascotas.',
          }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <View>
              <ToggleSwitch
                label="Mascotas"
                value={value}
                onChange={onChange}
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="anualizado"
          render={({ field: { value, onChange } }) => (
            <ToggleSwitch label="Contrato Anual" value={value} onChange={onChange} />
          )}
        />

        <Controller
          control={control}
          name="telefono"
          rules={{
            required: 'El teléfono es obligatorio.',
            pattern: { value: /^\d{10}$/, message: 'Debe tener 10 dígitos.' },
          }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <FormInput label="Teléfono de Contacto" error={error}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="1234567890"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </FormInput>
          )}
        />
      </View>
    );
  }

  function renderStep2() {
    return (
      <View>
        <Text style={styles.stepTitle}>Paso 2 de 3: Ubicación</Text>

        <FormInput label="País">
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value="México"
            editable={false}
          />
        </FormInput>

        <Controller
          control={control}
          name="estado_ubicacion"
          rules={{ required: 'Selecciona un estado.' }}
          render={({ field: { value }, fieldState: { error } }) => (
            <SelectModal
              label="Estado"
              placeholder="Selecciona"
              options={ESTADOS_MEXICO.map((estado) => ({
                label: estado,
                value: estado,
              }))}
              selectedValue={value}
              onSelect={(selected) => setValue('estado_ubicacion', selected, { shouldValidate: true })}
              error={error}
              touched
            />
          )}
        />

        <Controller
          control={control}
          name="ciudad"
          rules={{ required: 'Requerido.', maxLength: { value: 100, message: 'Máx. 100.' } }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <FormInput label="Ciudad" error={error}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="San Miguel de Allende"
                placeholderTextColor={colors.textSecondary}
              />
            </FormInput>
          )}
        />

        <Controller
          control={control}
          name="colonia"
          rules={{ required: 'Requerido.', maxLength: { value: 100, message: 'Máx. 100.' } }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <FormInput label="Colonia" error={error}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Centro"
                placeholderTextColor={colors.textSecondary}
              />
            </FormInput>
          )}
        />

        <Controller
          control={control}
          name="direccion"
          rules={{ required: 'Requerido.', maxLength: { value: 255, message: 'Máx. 255.' } }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <FormInput label="Dirección Completa" error={error}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Calle, número y código postal"
                placeholderTextColor={colors.textSecondary}
              />
            </FormInput>
          )}
        />

        <TouchableOpacity
          style={styles.locationButton}
          onPress={useCurrentLocation}
          activeOpacity={0.8}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.locationButtonText}>Usar mi ubicación actual</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  function renderStep3() {
    return (
      <View>
        <Text style={styles.stepTitle}>Paso 3 de 3: Fotos</Text>
        <Text style={styles.stepDescription}>
          Sube entre 1 y 5 fotos. Puedes usar la cámara o elegir de la galería.
        </Text>

        <Controller
          control={control}
          name="fotos"
          rules={{
            validate: (value) => {
              const total = (isEdit ? existingFotos.length : 0) + (value?.length || 0);
              if (total < 1) return 'Debes subir al menos 1 imagen.';
              if (total > 5) return 'No puedes subir más de 5 imágenes.';
              return true;
            },
          }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <>
              {isEdit && existingFotos.length > 0 && (
                <View style={styles.existingFotosRow}>
                  {existingFotos.map((path) => (
                    <View key={path} style={styles.existingThumbContainer}>
                      <Image source={{ uri: fotoUrl(path) }} style={styles.existingThumb} />
                      <TouchableOpacity
                        style={styles.removeExistingBtn}
                        onPress={() => removeExistingFoto(path)}
                      >
                        <Text style={styles.removeExistingBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              {isEdit && existingFotos.length > 0 && (
                <Text style={styles.existingHint}>
                  Toca ✕ para quitar una foto que ya no quieras conservar.
                </Text>
              )}
              {5 - existingFotos.length > 0 && (
                <PhotoPicker
                  photos={value || []}
                  onPhotosChange={onChange}
                  error={error?.message}
                  touched
                  maxPhotos={5 - existingFotos.length}
                />
              )}
            </>
          )}
        />
      </View>
    );
  }

  function renderContent() {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  }

  function renderFooter() {
    const isLastStep = currentStep === TOTAL_STEPS;

    return (
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.footerButton, styles.secondaryButton]}
            onPress={handlePrevious}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Anterior</Text>
          </TouchableOpacity>
        )}

        {isLastStep ? (
          
          <TouchableOpacity
  style={[styles.footerButton, styles.primaryButton]}
  onPress={handleSubmit(
    async (data) => { // <-- Agregamos async aquí
      console.log('==============================');
      console.log('🟢 BOTÓN PUBLICAR PRESIONADO');
      console.log('Paso actual:', currentStep);
      console.log('✅ VALIDACIÓN EXITOSA');
      console.log('Datos del formulario:', data);
      
      await onSubmit(data); // <-- Este await es CLAVE
    },
    (errors) => {
      console.log('❌ VALIDACIÓN FALLIDA');
      console.log(errors);
      Object.entries(errors).forEach(([campo, error]) => {
        console.log(`${campo}:`, error.message);
      });
      alert('Hay errores en el formulario. Revisa la consola.');
    }
  )}
  activeOpacity={0.8}
  disabled={isSubmitting || isLoadingTipos}
>
  {isSubmitting ? (
    <ActivityIndicator color="#FFFFFF" />
  ) : (
    <Text style={styles.primaryButtonText}>
      Publicar Propiedad
    </Text>
  )}
</TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.footerButton, styles.primaryButton]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Siguiente</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (isLoadingTipos) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderProgress()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>
      {renderFooter()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.inputBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '600',
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
    marginTop: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  existingFotosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  existingThumbContainer: {
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
  },
  existingThumb: {
    width: '100%',
    height: '100%',
  },
  removeExistingBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeExistingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  existingHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  disabledInput: {
    backgroundColor: colors.inputBg,
    color: colors.textSecondary,
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  third: {
    flex: 1,
  },
  locationButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
});
