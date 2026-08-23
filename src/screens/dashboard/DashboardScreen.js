import React, { useState, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Lista from '../../components/Lista';
import { colors } from '../../theme/colors';
import { serviceGet, BASE_URL } from '../../services/api';

const PROPIEDADES_DESTACADAS_LIMITE = 4;

function buildImageUrl(foto) {
  if (!foto) return '';
  if (foto.startsWith('http://') || foto.startsWith('https://')) return foto;
  const separator = foto.startsWith('/') ? '' : '/';
  return `${BASE_URL}/storage${separator}${foto}`;
}

export default function DashboardScreen({ navigation }) {
  const [favoritos, setFavoritos] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [propiedadesRaw, setPropiedadesRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatearPrecio = (num) => {
    return Number(num).toLocaleString('es-MX');
  };

  const cargarPropiedades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await serviceGet('propiedades');
      const lista = res?.data?.data ?? [];
      setPropiedadesRaw(lista);
      const mapeadas = lista.map((item) => ({
        id: item.id_propiedad,
        titulo: item.titulo,
        ubicacion: `${item.colonia}, ${item.ciudad}`,
        precio: formatearPrecio(item.precio),
        habitaciones: item.habitaciones,
        banos: item.banos,
        metros: item.metros_cuadrados,
        imagen: Array.isArray(item.fotos) && item.fotos.length > 0 ? buildImageUrl(item.fotos[0]) : '',
      }));
      setPropiedades(mapeadas.slice(0, PROPIEDADES_DESTACADAS_LIMITE));
    } catch (e) {
      setError(e.message || 'Error al cargar propiedades');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarPropiedades();
    }, [cargarPropiedades])
  );

  const toggleFavorito = (id) => {
    setFavoritos((prev) => prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]);
  };

  const renderHeaderContenido = () => (
    <View style={styles.headerScrollableContent}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop' }}
        style={styles.heroImage}
        imageStyle={styles.heroImageStyle}
      >
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Encuentra tu hogar temporal perfecto</Text>
          <Text style={styles.heroSubtitle}>Rentas Mensuales con todas las comodidades</Text>
          <TouchableOpacity style={styles.heroButton} activeOpacity={0.85}>
            <Text style={styles.heroButtonText}>Explorar propiedades</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <View style={styles.whyNestlySection}>
        <Text style={styles.whyTitle}>¿Por qué elegir Nestly?</Text>
        <Text style={styles.whySubtitle}>La mejor plataforma para rentas mensuales</Text>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Propiedades Destacadas</Text>
          <Text style={styles.sectionSubtitle}>Las mejores opciones esta semana</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <Image 
          source={require('../../../assets/Logo.png')} 
          style={styles.logoImage} 
        />
        
        <TouchableOpacity style={styles.avatarButton} onPress={() => navigation.navigate('Perfil')} activeOpacity={0.7}>
          <Ionicons name="person-circle-outline" size={34} color="#000000" />
        </TouchableOpacity>
      </View>

      <View style={styles.catalogSection}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>Cargando propiedades...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={cargarPropiedades} activeOpacity={0.85}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Lista
            propiedades={propiedades}
            onPropiedadPress={(propiedad) => {
              const raw = propiedadesRaw.find((p) => p.id_propiedad === propiedad.id);
              navigation.navigate('Detalle', { propiedad: raw || propiedad });
            }}
            headerComponent={renderHeaderContenido()}
            favoritos={favoritos}
            onToggleFavorito={toggleFavorito}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.inputBg,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    zIndex: 30,
  },
  logoImage: {
    width: 120,
    height: 35,
    resizeMode: 'contain',
  },
  avatarButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catalogSection: {
    flex: 1,
  },
  headerScrollableContent: {
    backgroundColor: colors.inputBg,
    paddingTop: 16,
  },
  heroImage: {
    marginHorizontal: 16,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
  },
  heroImageStyle: {
    borderRadius: 20,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.cardBg,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 30,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.cardBg,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    opacity: 0.9,
  },
  heroButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  heroButtonText: {
    color: colors.cardBg,
    fontSize: 16,
    fontWeight: '700',
  },
  whyNestlySection: {
    paddingHorizontal: 16,
    marginBottom: 28,
    alignItems: 'center',
  },
  whyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  whySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  stateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
  },
  retryButtonText: {
    color: colors.cardBg,
    fontSize: 16,
    fontWeight: '700',
  },
});