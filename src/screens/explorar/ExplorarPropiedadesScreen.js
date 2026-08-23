import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { serviceGet, BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Lista from '../../components/Lista';
import RangeSlider from '../../components/RangeSlider';

function buildImageUrl(foto) {
  if (!foto) return '';
  if (foto.startsWith('http://') || foto.startsWith('https://')) return foto;
  const separator = foto.startsWith('/') ? '' : '/';
  return `${BASE_URL}/storage${separator}${foto}`;
}

const formatearPrecio = (num) => {
  return Number(num).toLocaleString('es-MX');
};

const HABITACIONES_OPCIONES = [
  { label: 'Todas', value: null },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
];

const BANOS_OPCIONES = [
  { label: 'Todos', value: null },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
];

export default function ExplorarPropiedadesScreen({ navigation }) {
  const { favoritosIds, toggleFavorito } = useAuth();

  const [propiedades, setPropiedades] = useState([]);
  const [propiedadesFiltradas, setPropiedadesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [panelHeight, setPanelHeight] = useState(new Animated.Value(0));
  const [filtros, setFiltros] = useState({
    direccion: '',
    precioMin: 0,
    precioMax: 100000,
    habitaciones: null,
    banos: null,
  });
  const [precioMaxReal, setPrecioMaxReal] = useState(100000);

  const cargarPropiedades = useCallback(async () => {
    try {
      setLoading(true);
      const res = await serviceGet('propiedades');
      const lista = res?.data?.data ?? [];
      const mapeadas = lista.map((item) => ({
        id: item.id_propiedad,
        titulo: item.titulo,
        ubicacion: `${item.colonia}, ${item.ciudad}`,
        direccion: item.direccion,
        colonia: item.colonia,
        ciudad: item.ciudad,
        estado: item.estado_ubicacion,
        precio: formatearPrecio(item.precio),
        precioNum: item.precio,
        habitaciones: item.habitaciones,
        banos: item.banos,
        metros: item.metros_cuadrados,
        imagen: Array.isArray(item.fotos) && item.fotos.length > 0 ? buildImageUrl(item.fotos[0]) : '',
        tipo_propiedad: item.tipo_propiedad,
        estado_propiedad: item.estado_propiedad,
        fotos: item.fotos,
        fotos_url: item.fotos_url,
        propietario: item.propietario,
        resenas_avg_puntuacion: item.resenas_avg_puntuacion,
        tipo_operacion: item.tipo_operacion,
        deposito: item.deposito,
        mascotas: item.mascotas,
        amueblado: item.amueblado,
        anualizado: item.anualizado,
        descripcion: item.descripcion,
        email: item.email,
        telefono: item.telefono,
      }));
      setPropiedades(mapeadas);
      const maxPrecio = mapeadas.length > 0
        ? Math.max(...mapeadas.map(p => p.precioNum))
        : 100000;
      const roundedMax = Math.ceil(maxPrecio / 5000) * 5000;
      setPrecioMaxReal(roundedMax);
      setFiltros(prev => ({ ...prev, precioMax: roundedMax }));
    } catch (e) {
      console.error('Error cargando propiedades:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarPropiedades();
    }, [cargarPropiedades])
  );

  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (filtros.direccion) count++;
    if (filtros.precioMin > 0) count++;
    if (filtros.precioMax < precioMaxReal) count++;
    if (filtros.habitaciones) count++;
    if (filtros.banos) count++;
    return count;
  }, [filtros, precioMaxReal]);

  const aplicarFiltros = useCallback(() => {
    let resultado = [...propiedades];

    if (filtros.direccion) {
      const busqueda = filtros.direccion.toLowerCase().trim();
      resultado = resultado.filter(p =>
        (p.ubicacion?.toLowerCase().includes(busqueda)) ||
        (p.direccion?.toLowerCase().includes(busqueda)) ||
        (p.colonia?.toLowerCase().includes(busqueda)) ||
        (p.ciudad?.toLowerCase().includes(busqueda))
      );
    }

    resultado = resultado.filter(p =>
      p.precioNum >= filtros.precioMin && p.precioNum <= filtros.precioMax
    );

    if (filtros.habitaciones) {
      resultado = resultado.filter(p => p.habitaciones >= filtros.habitaciones);
    }

    if (filtros.banos) {
      resultado = resultado.filter(p => p.banos >= filtros.banos);
    }

    resultado.sort((a, b) => a.precioNum - b.precioNum);

    setPropiedadesFiltradas(resultado);
  }, [propiedades, filtros]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  const toggleFiltrosPanel = () => {
    setFiltrosAbiertos(!filtrosAbiertos);
    Animated.timing(panelHeight, {
      toValue: !filtrosAbiertos ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const resetFiltros = () => {
    setFiltros({
      direccion: '',
      precioMin: 0,
      precioMax: precioMaxReal,
      habitaciones: null,
      banos: null,
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarPropiedades();
  }, [cargarPropiedades]);

  const renderFiltrosPanel = () => (
    <Animated.View
      style={[
        styles.filtrosPanel,
        { opacity: panelHeight },
        { height: filtrosAbiertos ? undefined : 0 },
      ]}
    >
      <View style={styles.filtroGroup}>
        <Text style={styles.filtroLabel}>Buscar por dirección</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Colonia, calle, ciudad..."
          value={filtros.direccion}
          onChangeText={(v) => setFiltros(prev => ({ ...prev, direccion: v }))}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => Keyboard.dismiss()}
        />
      </View>

      <View style={styles.filtroGroup}>
        <View style={styles.filtroHeader}>
          <Text style={styles.filtroLabel}>Rango de precio</Text>
          <Text style={styles.filtroValue}>
            ${formatearPrecio(filtros.precioMin)} - ${formatearPrecio(filtros.precioMax)}
          </Text>
        </View>
        <RangeSlider
          min={0}
          max={precioMaxReal}
          step={500}
          values={[filtros.precioMin, filtros.precioMax]}
          onChange={([min, max]) => setFiltros(prev => ({ ...prev, precioMin: min, precioMax: max }))}
        />
      </View>

      <View style={styles.filtroRow}>
        <View style={styles.filtroGroup}>
          <Text style={styles.filtroLabel}>Habitaciones (mín.)</Text>
          <Picker
            selectedValue={filtros.habitaciones}
            onValueChange={(v) => setFiltros(prev => ({ ...prev, habitaciones: v === 'null' ? null : Number(v) }))}
            style={styles.picker}
            mode="dialog"
            itemStyle={styles.pickerItem}
          >
            {HABITACIONES_OPCIONES.map((opt) => (
              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
            ))}
          </Picker>
        </View>

        <View style={styles.filtroGroup}>
          <Text style={styles.filtroLabel}>Baños (mín.)</Text>
          <Picker
            selectedValue={filtros.banos}
            onValueChange={(v) => setFiltros(prev => ({ ...prev, banos: v === 'null' ? null : Number(v) }))}
            style={styles.picker}
            mode="dialog"
            itemStyle={styles.pickerItem}
          >
            {BANOS_OPCIONES.map((opt) => (
              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
            ))}
          </Picker>
        </View>
      </View>

      {filtrosActivos > 0 && (
        <TouchableOpacity style={styles.resetBtn} onPress={resetFiltros} activeOpacity={0.7}>
          <Text style={styles.resetBtnText}>Limpiar filtros</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  if (loading && propiedades.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando propiedades...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explorar Propiedades</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filtrosContainer}>
        <TouchableOpacity style={styles.filtrosToggle} onPress={toggleFiltrosPanel} activeOpacity={0.7}>
          <Ionicons
            name={filtrosAbiertos ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.textPrimary}
          />
          <Text style={[
            styles.filtrosToggleText,
            filtrosActivos > 0 && styles.filtrosToggleTextActive
          ]}>
            Filtros {filtrosActivos > 0 && `(${filtrosActivos})`}
          </Text>
        </TouchableOpacity>

        {renderFiltrosPanel()}
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {propiedadesFiltradas.length} {propiedadesFiltradas.length === 1 ? 'propiedad' : 'propiedades'} encontrada(s)
        </Text>
        <View style={styles.sortInfo}>
          <Ionicons name="arrow-up" size={16} color={colors.textSecondary} />
          <Text style={styles.sortText}>Orden: Precio menor a mayor</Text>
        </View>
      </View>

      {propiedadesFiltradas.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No hay propiedades</Text>
          <Text style={styles.emptyDesc}>
            {filtrosActivos > 0
              ? 'Prueba ajustando los filtros de búsqueda'
              : 'No hay propiedades disponibles en este momento'}
          </Text>
          {filtrosActivos > 0 && (
            <TouchableOpacity style={styles.resetBtn} onPress={resetFiltros} activeOpacity={0.7}>
              <Text style={styles.resetBtnText}>Limpiar todos los filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Lista
          propiedades={propiedadesFiltradas}
          onPropiedadPress={(propiedad) => {
            navigation.navigate('Detalle', { propiedad });
          }}
          favoritos={favoritosIds}
          onToggleFavorito={toggleFavorito}
        />
      )}
    </ScrollView>
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
    backgroundColor: colors.inputBg,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBg,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  filtrosContainer: {
    backgroundColor: colors.cardBg,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBg,
  },
  filtrosToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.inputBg,
    borderRadius: 8,
  },
  filtrosToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filtrosToggleTextActive: {
    color: colors.primary,
  },
  filtrosPanel: {
    marginTop: 12,
    overflow: 'hidden',
  },
  filtroGroup: {
    marginBottom: 16,
  },
  filtroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  filtroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  filtroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  textInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.inputBg,
  },
  picker: {
    height: 48,
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBg,
  },
  pickerItem: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  resetBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cc0000',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sortInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});