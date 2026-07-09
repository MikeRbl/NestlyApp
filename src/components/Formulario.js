import { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { colors } from '../theme/colors';
import { crearPropiedad, getTiposDePropiedad } from '../services/api';
import ToggleSwitch from './ToggleSwitch';
import SelectModal from './SelectModal';
import PhotoPicker from './PhotoPicker';

const TOTAL_STEPS = 3;
const GEOCODE_DEBOUNCE_MS = 700;

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

export default function Formulario({ onClose, user, navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [tiposDePropiedad, setTiposDePropiedad] = useState([]);
  const [isLoadingTipos, setIsLoadingTipos] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      titulo: '',
      descripcion: '',
      direccion: '',
      pais: 'México',
      estado_ubicacion: '',
      ciudad: '',
      colonia: '',
      latitud: '',
      longitud: '',
      precio: '',
      habitaciones: '',
      banos: '',
      metros_cuadrados: '',
      deposito: '',
      amueblado: false,
      anualizado: false,
      mascotas: '',
      tipo_propiedad_id: '',
      fotos: [],
      telefono: '',
    },
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
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.address) {
        const address = data.address;
        setValue('direccion', data.name || data.display_name || '', { shouldValidate: false });
        setValue('pais', address.country || '', { shouldValidate: false });
        setValue('estado_ubicacion', address.state || address.state_district || '', { shouldValidate: false });
        setValue('ciudad', address.city || address.town || address.village || '', { shouldValidate: false });
        setValue('colonia', address.suburb || address.neighbourhood || '', { shouldValidate: false });
      } else {
        Toast.show({
          type: 'info',
          text1: 'No se encontraron detalles para la ubicación.',
        });
      }
    } catch (error) {
      console.error('Error al geocodificar (reverse):', error);
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
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setValue('latitud', String(lat), { shouldValidate: false });
        setValue('longitud', String(lon), { shouldValidate: false });
        await geocodeLatLng(lat, lon);
      } else {
        Toast.show({
          type: 'info',
          text1: 'Dirección no encontrada. Intenta ser más específico.',
        });
      }
    } catch (error) {
      console.error('Error en geocodificación directa:', error);
      Toast.show({
        type: 'error',
        text1: `Error al buscar en mapa: ${error.message}`,
      });
    }
  }, [setValue, geocodeLatLng]);

  useEffect(() => {
    const [direccion, colonia, ciudad, estado_ubicacion, pais] = watchedFields;
    const fullAddressQuery = [direccion, colonia, ciudad, estado_ubicacion, pais]
      .filter((part) => part && part.trim() !== '')
      .join(', ');

    if (fullAddressQuery.length <= 5) return;

    const timer = setTimeout(() => {
      geocodeAddress(fullAddressQuery);
    }, GEOCODE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [watchedFields, geocodeAddress]);

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
      setValue('latitud', String(latitude), { shouldValidate: true });
      setValue('longitud', String(longitude), { shouldValidate: true });
      await geocodeLatLng(latitude, longitude);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
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
    2: ['pais', 'estado_ubicacion', 'ciudad', 'colonia', 'direccion', 'latitud', 'longitud'], 
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
    
    if (user?.role === 'inquilino') {
      Toast.show({
        type: 'error',
        text1: 'Los inquilinos no pueden publicar propiedades.',
      });
      return;
    }

    const fotos = formValues.fotos || [];
    if (fotos.length < 1) {
      Toast.show({ type: 'error', text1: 'Debes subir al menos 1 imagen.' });
      return;
    }
    if (fotos.length > 5) {
      Toast.show({ type: 'error', text1: 'No puedes subir más de 5 imágenes.' });
      return;
    }

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
        
        formData.append(key, String(finalValue));
      });

      if (user?.email) {
        formData.append('email', user.email);
      }

      // Procesamiento de imágenes (Web vs Móvil)
      if (Platform.OS === 'web') {
        for (const file of fotos) {
          const fileObj = await uriToFile(
            file.uri,
            file.fileName || file.uri.split('/').pop(),
            file.type || 'image/jpeg'
          );
          formData.append('fotos[]', fileObj);
        }
      } else {
        fotos.forEach((file) => {
          formData.append('fotos[]', {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.fileName || file.uri.split('/').pop(),
          });
        });
      }

      console.log('🌐 3. Llamando a crearPropiedad()...');
      
      const respuesta = await crearPropiedad(formData);
      
      console.log('✅ 4. Propiedad creada exitosamente en backend:', respuesta);

      Toast.show({
        type: 'success',
        text1: '¡Propiedad publicada correctamente!',
      });

      // Limpieza y redirección
      reset();
      setCurrentStep(1);
      onClose();
      navigation?.navigate?.('Dashboard');
      
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
      } else {
        Toast.show({
          type: 'error',
          text1: err.message || 'Ocurrió un error inesperado.',
        });
      }
    }
  };

  function renderHeader() {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Publicar Propiedad</Text>
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
          rules={{ required: 'Indica si se aceptan mascotas.' }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <View>
              <ToggleSwitch
                label="Mascotas"
                value={value}
                onChange={onChange}
                options={['Sí', 'No']}
                activeValues={[true, false]}
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
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput label="Colonia (opcional)">
              <TextInput
                style={styles.input}
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
                placeholder="Calle, número, código postal"
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

        <View style={styles.row}>
          <View style={styles.half}>
            <Controller
              control={control}
              name="latitud"
              rules={{ required: 'Requerido.' }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormInput label="Latitud" error={error}>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0.0000"
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
              name="longitud"
              rules={{ required: 'Requerido.' }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormInput label="Longitud" error={error}>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0.0000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </FormInput>
              )}
            />
          </View>
        </View>
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
            required: 'Debes subir al menos 1 imagen.',
            validate: (value) => {
              if (value.length < 1) return 'minPhotos';
              if (value.length > 5) return 'maxPhotos';
              return true;
            },
          }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <PhotoPicker
              photos={value || []}
              onPhotosChange={onChange}
              error={error?.message}
              touched
            />
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
