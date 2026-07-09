import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  RefreshControl,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { serviceGet, servicePost } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://127.0.0.1:8000';

export default function PerfilScreen({ navigation }) {
  const { user, logout, loadUser } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [propiedades, setPropiedades] = useState([]);
  const [propiedadesMostradas, setPropiedadesMostradas] = useState([]);
  const [loadingPropiedades, setLoadingPropiedades] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserData();
    checkSolicitud();
  }, []);

  const checkSolicitud = async () => {
    const sent = await AsyncStorage.getItem('roleRequestSent');
    if (sent === 'true') setSolicitudEnviada(true);
  };

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const response = await serviceGet('user');
      setUserData(response.user);
      fetchPropiedades(response.user?.id);
    } catch (err) {
      console.error('Error al cargar datos del usuario:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPropiedades = async (userId) => {
    if (!userId) return;
    setLoadingPropiedades(true);
    try {
      const response = await serviceGet(`users/${userId}/propiedades?limit=100`);
      const data = response.data || [];
      setPropiedades(data);
      selectRandom(data);
    } catch (err) {
      console.error('Error al cargar propiedades:', err);
      setPropiedades([]);
      setPropiedadesMostradas([]);
    } finally {
      setLoadingPropiedades(false);
    }
  };

  const selectRandom = (list) => {
    if (list.length <= 3) {
      setPropiedadesMostradas([...list]);
    } else {
      const copy = [...list];
      const selected = [];
      for (let i = 0; i < 3; i++) {
        const idx = Math.floor(Math.random() * copy.length);
        selected.push(copy[idx]);
        copy.splice(idx, 1);
      }
      setPropiedadesMostradas(selected);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, []);

  const enviarSolicitud = async () => {
    try {
      await servicePost('role-requests');
      await AsyncStorage.setItem('roleRequestSent', 'true');
      setSolicitudEnviada(true);
      alert('¡Solicitud enviada! Un administrador la revisará pronto.');
    } catch (err) {
      if (err.status === 400 || err.status === 409) {
        await AsyncStorage.setItem('roleRequestSent', 'true');
        setSolicitudEnviada(true);
        alert('Ya tienes una solicitud pendiente.');
      } else {
        alert(err.error?.message || 'Error al enviar la solicitud');
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (isLoading && !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361ee" />
        <Text style={styles.loadingText}>Cargando datos del usuario...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.wrapper}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.container}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarIcon}>👤</Text>
            </View>
            <Text style={styles.userName}>
              {userData?.first_name || 'Usuario'} {userData?.last_name_paternal || ''}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{userData?.role || 'Usuario'}</Text>
            </View>
          </View>

          <View style={styles.navItems}>
            <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
              <Text style={[styles.navItemText, styles.navItemTextActive]}>Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate('Formulario')}
            >
              <Text style={styles.navItemText}>Editar Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navItem, styles.logoutItem]} onPress={handleLogout}>
              <Text style={[styles.navItemText, styles.logoutText]}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {userData && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información Personal</Text>
              <View style={styles.infoGrid}>
                <InfoItem icon="👤" label="Nombre completo" value={`${userData.first_name} ${userData.last_name_paternal} ${userData.last_name_maternal}`} />
                <InfoItem icon="✉️" label="Correo electrónico" value={userData.email} />
                <InfoItem icon="📞" label="Teléfono" value={userData.phone || 'No proporcionado'} />
                <InfoItem icon="📅" label="Miembro desde" value={formatDate(userData.created_at)} />
              </View>
            </View>
          )}

          {userData && userData.role === 'inquilino' && (
            <LinearGradient
              colors={['#4361ee', '#3f37c9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaCard}
            >
              <View style={styles.ctaHeader}>
                <View style={styles.ctaIconCircle}>
                  <Text style={styles.ctaIcon}>🔑</Text>
                </View>
                <View style={styles.ctaHeaderText}>
                  <Text style={styles.ctaTitle}>Conviértete en Propietario</Text>
                  <Text style={styles.ctaSubtitle}>Desbloquea nuevas funciones y publica tus propiedades.</Text>
                </View>
              </View>
              <Text style={styles.ctaBody}>
                Al cambiar tu rol, podrás listar tus propiedades y gestionar reservas.
              </Text>
              <View style={styles.ctaBtnRow}>
                <TouchableOpacity
                  style={[styles.ctaBtn, solicitudEnviada && styles.ctaBtnDisabled]}
                  onPress={enviarSolicitud}
                  disabled={solicitudEnviada}
                >
                  <Text style={[styles.ctaBtnText, solicitudEnviada && styles.ctaBtnTextDisabled]}>
                    {solicitudEnviada ? 'Solicitud Pendiente' : 'Enviar Solicitud'}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mis Propiedades</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{propiedades.length} Publicada(s)</Text>
              </View>
            </View>

            {loadingPropiedades ? (
              <View style={styles.skeletonGrid}>
                {[1, 2, 3].map((n) => (
                  <SkeletonCard key={n} />
                ))}
              </View>
            ) : propiedades.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No has publicado propiedades aún</Text>
                <Text style={styles.emptyDesc}>Publica tu primera propiedad para comenzar.</Text>
                <TouchableOpacity style={styles.publishBtn}>
                  <Text style={styles.publishBtnText}>Publicar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.propertiesGrid}>
                {propiedadesMostradas.map((prop) => (
                  <PropertyCard key={prop.id} propiedad={prop} />
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIconCircle}>
        <Text style={styles.infoIconText}>{icon}</Text>
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function SkeletonCard() {
  const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.skeletonCard}>
      <Animated.View style={[styles.skeletonImage, { opacity: pulseAnim }]} />
      <View style={styles.skeletonContent}>
        <Animated.View style={[styles.skeletonLine, { width: '70%', opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonLine, { width: '50%', opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonLine, { width: '40%', opacity: pulseAnim }]} />
      </View>
    </View>
  );
}

function PropertyCard({ propiedad }) {
  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'Rentada': return { backgroundColor: '#4cc9f0' };
      case 'Disponible': return { backgroundColor: '#2ec4b6' };
      case 'Inactiva': return { backgroundColor: '#adb5bd' };
      default: return { backgroundColor: '#e0e4fc' };
    }
  };

  return (
    <TouchableOpacity style={styles.propertyCard}>
      <View style={styles.propertyImageContainer}>
        {propiedad.fotos?.length > 0 ? (
          <Image
            source={{ uri: `${API_URL}/storage/${propiedad.fotos[0]}` }}
            style={styles.propertyImage}
          />
        ) : (
          <View style={styles.propertyImagePlaceholder}>
            <Text style={styles.placeholderIcon}>🏠</Text>
          </View>
        )}
        <View style={styles.propertyOverlay} />
        <View style={[styles.propertyBadge, getEstadoStyle(propiedad.estado_propiedad)]}>
          <Text style={styles.propertyBadgeText}>{propiedad.estado_propiedad}</Text>
        </View>
        {propiedad.resenas_avg_puntuacion != null && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingStar}>⭐</Text>
            <Text style={styles.ratingText}>{Number(propiedad.resenas_avg_puntuacion).toFixed(1)}</Text>
          </View>
        )}
      </View>
      <View style={styles.propertyDetails}>
        <Text style={styles.propertyTitle} numberOfLines={1}>{propiedad.titulo}</Text>
        <View style={styles.propertyTypeBadge}>
          <Text style={styles.propertyTypeText}>{propiedad.tipo_propiedad?.nombre || 'Propiedad'}</Text>
        </View>
        <Text style={styles.propertyLocation}>📍 {propiedad.direccion}</Text>
        <View style={styles.propertyFeatures}>
          <Text style={styles.feature}>🛏 {propiedad.habitaciones} hab</Text>
          <Text style={styles.feature}>🚿 {propiedad.banos} baños</Text>
        </View>
        <View style={styles.propertyFooter}>
          <View style={styles.ownerInfo}>
            {propiedad.propietario?.avatar_url ? (
              <Image source={{ uri: propiedad.propietario.avatar_url }} style={styles.ownerAvatar} />
            ) : (
              <View style={styles.ownerAvatarPlaceholder}>
                <Text>👤</Text>
              </View>
            )}
            <View>
              <Text style={styles.ownerName}>{propiedad.propietario?.first_name}</Text>
              <Text style={styles.ownerLabel}>Propietario</Text>
            </View>
          </View>
          <Text style={styles.propertyPrice}>
            ${propiedad.precio}
            {propiedad.tipo_operacion === 'Renta' && '/mes'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e0e4fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarIcon: { fontSize: 30 },
  userName: { fontSize: 16, fontWeight: '600', color: '#2b2d42', textAlign: 'center' },
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
  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#2b2d42' },
  countBadge: {
    backgroundColor: '#e0e4fc',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: { color: '#4361ee', fontSize: 13, fontWeight: '600' },

  infoGrid: { gap: 12 },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e4fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIconText: { fontSize: 16 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, textTransform: 'uppercase', color: '#8d99ae', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#2b2d42', marginTop: 2 },

  ctaCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
  },
  ctaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ctaIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  ctaIcon: { fontSize: 22 },
  ctaHeaderText: { flex: 1 },
  ctaTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  ctaSubtitle: { color: '#c5d0f7', fontSize: 13, marginTop: 4 },
  ctaBody: { color: '#e0e4fc', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  ctaBtnRow: { alignItems: 'flex-end' },
  ctaBtn: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  ctaBtnDisabled: { backgroundColor: '#e0e0e0' },
  ctaBtnText: { color: '#4361ee', fontWeight: '600', fontSize: 14 },
  ctaBtnTextDisabled: { color: '#999' },

  emptyState: {
    alignItems: 'center',
    padding: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  emptyTitle: { fontWeight: '600', color: '#2b2d42', marginBottom: 4 },
  emptyDesc: { color: '#8d99ae', fontSize: 13, marginBottom: 12 },
  publishBtn: {
    backgroundColor: '#4361ee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  publishBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },

  skeletonGrid: { gap: 16 },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  skeletonImage: { width: '100%', height: 180, backgroundColor: '#e0e0e0' },
  skeletonContent: { padding: 14, gap: 8 },
  skeletonLine: { height: 12, backgroundColor: '#e0e0e0', borderRadius: 6 },

  propertiesGrid: { gap: 16 },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  propertyImageContainer: { position: 'relative', height: 200 },
  propertyImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  propertyImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: { fontSize: 40 },
  propertyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  propertyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  propertyBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingStar: { fontSize: 12 },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#2b2d42' },

  propertyDetails: { padding: 14 },
  propertyTitle: { fontSize: 16, fontWeight: '600', color: '#2b2d42', marginBottom: 6 },
  propertyTypeBadge: {
    backgroundColor: '#7fa6ff',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  propertyTypeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  propertyLocation: { color: '#8d99ae', fontSize: 13, marginBottom: 8 },
  propertyFeatures: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  feature: { color: '#8d99ae', fontSize: 13 },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ownerAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#4361ee' },
  ownerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e4fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerName: { fontSize: 12, fontWeight: '600', color: '#2b2d42' },
  ownerLabel: { fontSize: 10, color: '#8d99ae' },
  propertyPrice: { fontSize: 16, fontWeight: '700', color: '#4361ee' },
});
