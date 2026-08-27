import React, { useState, useEffect, useContext, useCallback } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { serviceGet, servicePost, BASE_URL, MEDIA_URL, getFavoritos, eliminarPropiedad, actualizarEstadoPropiedad, getMisContactos, getMisContactosEnviados, responderContacto } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import FormularioScreen from './FormularioScreen';
import Formulario from '../components/Formulario';
import PropiedadCard from '../components/PropiedadCard';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function PerfilScreen({ navigation }) {
  const { user, logout, refreshUser, isGuest, exitGuestMode } = useContext(AuthContext);
  const { favoritosIds, toggleFavorito, loadFavoritos } = useAuth();
  const userData = user;
  const [showEditModal, setShowEditModal] = useState(false);
  const [propiedadEnEdicion, setPropiedadEnEdicion] = useState(null);
  const [propiedades, setPropiedades] = useState([]);
  const [loadingPropiedades, setLoadingPropiedades] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('propiedades');
  const [favoritos, setFavoritos] = useState([]);
  const [loadingFavoritos, setLoadingFavoritos] = useState(false);
  const [contactos, setContactos] = useState([]);
  const [loadingContactos, setLoadingContactos] = useState(false);
  const [misEnviados, setMisEnviados] = useState([]);
  const [loadingMisEnviados, setLoadingMisEnviados] = useState(false);
  const [respondiendoContactoId, setRespondiendoContactoId] = useState(null);

  const esPropietarioAdmin = userData?.role === 'propietario' || userData?.role === 'admin';

  useEffect(() => {
    checkSolicitud();
  }, []);

  useEffect(() => {
    if (activeTab === 'favoritos' && userData?.id) {
      fetchFavoritos();
    }
  }, [activeTab, userData?.id]);

  useEffect(() => {
    if (activeTab === 'solicitudes' && esPropietarioAdmin) {
      fetchContactos();
      fetchMisEnviados();
    }
  }, [activeTab, esPropietarioAdmin]);

  useEffect(() => {
    if (activeTab === 'mis-solicitudes' && !isGuest) {
      fetchMisEnviados();
    }
  }, [activeTab, isGuest]);

  useFocusEffect(
    useCallback(() => {
      loadFavoritos();
      if (!isGuest && userData?.id) {
        fetchPropiedades(userData.id);
      }
    }, [loadFavoritos, isGuest, userData?.id])
  );

  const checkSolicitud = async () => {
    const sent = await AsyncStorage.getItem('roleRequestSent');
    if (sent === 'true') setSolicitudEnviada(true);
  };

  const fetchPropiedades = async (userId) => {
    if (!userId) return;
    setLoadingPropiedades(true);
    try {
      const response = await serviceGet(`users/${userId}/propiedades?per_page=100`);
      const data = response.data || [];
      const transformed = data.map(transformPropiedad);
      setPropiedades(transformed);
    } catch (err) {
      console.error('Error al cargar propiedades:', err);
      setPropiedades([]);
    } finally {
      setLoadingPropiedades(false);
    }
  };

  const fetchFavoritos = async () => {
    setLoadingFavoritos(true);
    try {
      const response = await getFavoritos();
      const data = response.data || [];
      const transformed = data.map(transformPropiedad);
      setFavoritos(transformed);
    } catch (err) {
      console.error('Error al cargar favoritos:', err);
      setFavoritos([]);
    } finally {
      setLoadingFavoritos(false);
    }
  };

  const fetchContactos = async () => {
    if (!esPropietarioAdmin) return;
    setLoadingContactos(true);
    try {
      const response = await getMisContactos();
      setContactos(response.data || []);
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
      setContactos([]);
    } finally {
      setLoadingContactos(false);
    }
  };

  const fetchMisEnviados = async () => {
    if (isGuest) return;
    setLoadingMisEnviados(true);
    try {
      const response = await getMisContactosEnviados();
      setMisEnviados(response.data || []);
    } catch (err) {
      console.error('Error al cargar mis solicitudes:', err);
      setMisEnviados([]);
    } finally {
      setLoadingMisEnviados(false);
    }
  };

  const handleResponderContacto = (contacto, estado) => {
    const esAprobar = estado === 'aprobado';
    Alert.alert(
      esAprobar ? 'Aprobar solicitud' : 'Rechazar solicitud',
      esAprobar
        ? `¿Aprobar la solicitud de ${contacto.solicitante?.full_name || 'el solicitante'}?`
        : `¿Rechazar la solicitud de ${contacto.solicitante?.full_name || 'el solicitante'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: esAprobar ? 'Aprobar' : 'Rechazar',
          style: esAprobar ? 'default' : 'destructive',
          onPress: async () => {
            setRespondiendoContactoId(contacto.id);
            try {
              await responderContacto(contacto.id, estado);
              Toast.show({
                type: 'success',
                text1: esAprobar ? 'Solicitud aprobada.' : 'Solicitud rechazada.',
              });
              fetchContactos();
              fetchMisEnviados();
            } catch (err) {
              console.warn('Error al responder contacto:', err);
              Toast.show({
                type: 'error',
                text1: err.error?.message || err.message || 'No se pudo procesar la solicitud.',
              });
              fetchContactos();
            } finally {
              setRespondiendoContactoId(null);
            }
          },
        },
      ]
    );
  };

  const transformPropiedad = (prop) => ({
    id: prop.id_propiedad ?? prop.id,
    titulo: prop.titulo,
    imagen: prop.fotos?.[0] ? `${MEDIA_URL}/storage/${prop.fotos[0]}` : '',
    ubicacion: prop.direccion,
    precio: prop.precio,
    habitaciones: prop.habitaciones,
    banos: prop.banos,
    metros: prop.metros_cuadrados,
    // Keep original data for other uses
    ...prop,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      if (userData?.id) {
        await fetchPropiedades(userData.id);
      }
      if (activeTab === 'favoritos') {
        await fetchFavoritos();
      }
      if (activeTab === 'solicitudes' && esPropietarioAdmin) {
        await fetchContactos();
        await fetchMisEnviados();
      }
      if (activeTab === 'mis-solicitudes' && !isGuest) {
        await fetchMisEnviados();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refreshUser, userData?.id, esPropietarioAdmin, isGuest]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

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

  const recargarPropiedades = () => {
    if (userData?.id) fetchPropiedades(userData.id);
  };

  const handlePausarActivar = (propiedad) => {
    const esPausa = propiedad.estado_propiedad !== 'Inactiva';
    const nuevoEstado = esPausa ? 'Inactiva' : 'Disponible';

    Alert.alert(
      esPausa ? 'Pausar propiedad' : 'Activar propiedad',
      esPausa
        ? '¿Seguro que deseas pausar esta propiedad? Dejará de mostrarse en el catálogo.'
        : '¿Seguro que deseas reactivar esta propiedad? Volverá a estar disponible.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: esPausa ? 'Pausar' : 'Activar',
          style: esPausa ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await actualizarEstadoPropiedad(propiedad.id, nuevoEstado);
              Toast.show({
                type: 'success',
                text1: esPausa ? 'Propiedad pausada.' : 'Propiedad activada.',
              });
              recargarPropiedades();
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: err.error?.message || err.message || 'No se pudo actualizar el estado.',
              });
            }
          },
        },
      ]
    );
  };

  const handleEliminarPropiedad = (propiedad) => {
    Alert.alert(
      'Eliminar propiedad',
      '¿Seguro que deseas eliminar esta propiedad? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarPropiedad(propiedad.id);
              Toast.show({ type: 'success', text1: 'Propiedad eliminada.' });
              recargarPropiedades();
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: err.error?.message || err.message || 'No se pudo eliminar la propiedad.',
              });
            }
          },
        },
      ]
    );
  };

  const handleEditarPropiedad = (propiedad) => {
    setPropiedadEnEdicion(propiedad);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (isGuest) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.guestTitle}>Hola, Invitado</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Invitado</Text>
          </View>
          <Text style={styles.guestDesc}>
            Estás navegando sin una cuenta. Inicia sesión para guardar favoritos,
            publicar propiedades y personalizar tu perfil.
          </Text>
          <TouchableOpacity
            style={styles.guestPrimaryBtn}
            onPress={() => exitGuestMode('login')}
          >
            <Text style={styles.guestPrimaryBtnText}>Iniciar Sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.guestSecondaryBtn}
            onPress={() => exitGuestMode('register')}
          >
            <Text style={styles.guestSecondaryBtnText}>Crear Cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
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
            <TouchableOpacity
              style={[styles.navItem, activeTab === 'propiedades' && styles.navItemActive]}
              onPress={() => handleTabChange('propiedades')}
            >
              <Text style={[styles.navItemText, activeTab === 'propiedades' && styles.navItemTextActive]}>
                Perfil
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setShowEditModal(true)}
            >
              <Text style={styles.navItemText}>Editar Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navItem, activeTab === 'favoritos' && styles.navItemActive]}
              onPress={() => handleTabChange('favoritos')}
            >
              <Text style={[styles.navItemText, activeTab === 'favoritos' && styles.navItemTextActive]}>
                Favoritos
              </Text>
            </TouchableOpacity>
            {esPropietarioAdmin && (
              <TouchableOpacity
                style={[styles.navItem, activeTab === 'solicitudes' && styles.navItemActive]}
                onPress={() => handleTabChange('solicitudes')}
              >
                <Text style={[styles.navItemText, activeTab === 'solicitudes' && styles.navItemTextActive]}>
                  Solicitudes
                </Text>
              </TouchableOpacity>
            )}
            {!isGuest && (
              <TouchableOpacity
                style={[styles.navItem, activeTab === 'mis-solicitudes' && styles.navItemActive]}
                onPress={() => handleTabChange('mis-solicitudes')}
              >
                <Text style={[styles.navItemText, activeTab === 'mis-solicitudes' && styles.navItemTextActive]}>
                  Mis Solicitudes
                </Text>
              </TouchableOpacity>
            )}
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

          {activeTab === 'propiedades' && (
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
                  <TouchableOpacity
                    style={styles.publishBtn}
                    onPress={() => navigation.navigate('Publicar')}
                  >
                    <Text style={styles.publishBtnText}>Publicar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.propertiesGrid}>
                  {propiedades.map((prop) => (
                    <View key={prop.id} style={styles.propertyItem}>
                      <PropiedadCard
                        propiedad={prop}
                        esFavorito={favoritosIds.includes(prop.id)}
                        onToggleFavorito={() => toggleFavorito(prop.id)}
                        onPress={() => navigation.navigate('Detalle', { propiedad: prop })}
                      />
                      <View style={styles.ownerActions}>
                        <View style={[styles.estadoBadge, prop.estado_propiedad === 'Inactiva' && styles.estadoBadgeInactiva]}>
                          <Text style={styles.estadoBadgeText}>{prop.estado_propiedad || 'Disponible'}</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.editBtn]}
                          onPress={() => handleEditarPropiedad(prop)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="create-outline" size={15} color="#4361ee" />
                          <Text style={styles.editBtnText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, prop.estado_propiedad === 'Inactiva' ? styles.activateBtn : styles.pauseBtn]}
                          onPress={() => handlePausarActivar(prop)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={prop.estado_propiedad === 'Inactiva' ? 'play' : 'pause'}
                            size={15}
                            color={prop.estado_propiedad === 'Inactiva' ? '#16a34a' : '#d97706'}
                          />
                          <Text style={[styles.actionBtnText, prop.estado_propiedad === 'Inactiva' ? styles.activateText : styles.pauseText]}>
                            {prop.estado_propiedad === 'Inactiva' ? 'Activar' : 'Pausar'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => handleEliminarPropiedad(prop)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={15} color="#EF4444" />
                          <Text style={styles.deleteBtnText}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'favoritos' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Favoritos</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{favoritos.length} guardada(s)</Text>
                </View>
              </View>

              {loadingFavoritos ? (
                <View style={styles.skeletonGrid}>
                  {[1, 2, 3].map((n) => (
                    <SkeletonCard key={n} />
                  ))}
                </View>
              ) : favoritos.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No tienes favoritos aún</Text>
                  <Text style={styles.emptyDesc}>Marca propiedades con ❤️ para verlas aquí</Text>
                </View>
              ) : (
                <View style={styles.propertiesGrid}>
                  {favoritos.map((prop) => (
                    <PropiedadCard
                      key={prop.id}
                      propiedad={prop}
                      esFavorito={favoritosIds.includes(prop.id)}
                      onToggleFavorito={() => toggleFavorito(prop.id)}
                      onPress={() => navigation.navigate('Detalle', { propiedad: prop })}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'solicitudes' && esPropietarioAdmin && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Propiedades solicitadas</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {contactos.filter((c) => c.estado === 'pendiente').length} pendiente(s)
                  </Text>
                </View>
              </View>

              {loadingContactos ? (
                <View style={styles.skeletonGrid}>
                  {[1, 2, 3].map((n) => (
                    <SkeletonCard key={n} />
                  ))}
                </View>
              ) : contactos.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Sin solicitudes recibidas</Text>
                  <Text style={styles.emptyDesc}>Cuando alguien contacte tu propiedad, aparecerá aquí.</Text>
                </View>
              ) : (
                <View style={styles.contactosList}>
                  {contactos.map((contacto) => (
                    <View key={contacto.id} style={styles.contactoCard}>
                      <View style={styles.contactoHeader}>
                        <View style={styles.contactoAvatar}>
                          <Ionicons name="person" size={18} color="#4361ee" />
                        </View>
                        <View style={styles.contactoHeaderText}>
                          <Text style={styles.contactoNombre}>
                            {contacto.solicitante?.full_name || 'Solicitante'}
                          </Text>
                          <Text style={styles.contactoPropiedad}>
                            {contacto.propiedad?.titulo || 'Propiedad'}
                          </Text>
                        </View>
                        <View style={[styles.contactoEstadoBadge, contacto.estado === 'pendiente' && styles.contactoEstadoPendiente, contacto.estado === 'aprobado' && styles.contactoEstadoAprobado, contacto.estado === 'rechazado' && styles.contactoEstadoRechazado]}>
                          <Text style={styles.contactoEstadoText}>{contacto.estado}</Text>
                        </View>
                      </View>

                      {contacto.mensaje ? (
                        <Text style={styles.contactoMensaje}>"{contacto.mensaje}"</Text>
                      ) : null}

                      {contacto.estado === 'pendiente' && (
                        <View style={styles.contactoActions}>
                          <TouchableOpacity
                            style={[styles.contactoBtn, styles.contactoAprobarBtn]}
                            activeOpacity={0.8}
                            onPress={() => handleResponderContacto(contacto, 'aprobado')}
                            disabled={respondiendoContactoId === contacto.id}
                          >
                            <Ionicons name="checkmark" size={16} color="#16a34a" />
                            <Text style={styles.contactoAprobarText}>Aprobar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.contactoBtn, styles.contactoRechazarBtn]}
                            activeOpacity={0.8}
                            onPress={() => handleResponderContacto(contacto, 'rechazado')}
                            disabled={respondiendoContactoId === contacto.id}
                          >
                            <Ionicons name="close" size={16} color="#EF4444" />
                            <Text style={styles.contactoRechazarText}>Rechazar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.blockDivider} />

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mis Solicitudes</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {misEnviados.filter((c) => c.estado === 'pendiente').length} pendiente(s)
                  </Text>
                </View>
              </View>

              {loadingMisEnviados ? (
                <View style={styles.skeletonGrid}>
                  {[1, 2, 3].map((n) => (
                    <SkeletonCard key={n} />
                  ))}
                </View>
              ) : misEnviados.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No has enviado solicitudes</Text>
                  <Text style={styles.emptyDesc}>Las solicitudes que envíes a otros propietarios aparecerán aquí.</Text>
                </View>
              ) : (
                <View style={styles.contactosList}>
                  {misEnviados.map((contacto) => (
                    <View key={contacto.id} style={styles.contactoCard}>
                      <View style={styles.contactoHeader}>
                        <View style={styles.contactoAvatar}>
                          <Ionicons name="home-outline" size={18} color="#4361ee" />
                        </View>
                        <View style={styles.contactoHeaderText}>
                          <Text style={styles.contactoNombre}>
                            {contacto.propiedad?.titulo || 'Propiedad'}
                          </Text>
                          <Text style={styles.contactoPropiedad}>
                            {contacto.propiedad?.propietario?.full_name
                              ? `Propietario: ${contacto.propiedad.propietario.full_name}`
                              : 'Propietario'}
                          </Text>
                        </View>
                        <View style={[styles.contactoEstadoBadge, contacto.estado === 'pendiente' && styles.contactoEstadoPendiente, contacto.estado === 'aprobado' && styles.contactoEstadoAprobado, contacto.estado === 'rechazado' && styles.contactoEstadoRechazado]}>
                          <Text style={styles.contactoEstadoText}>{contacto.estado}</Text>
                        </View>
                      </View>

                      {contacto.mensaje ? (
                        <Text style={styles.contactoMensaje}>"{contacto.mensaje}"</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'mis-solicitudes' && !isGuest && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mis Solicitudes</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {misEnviados.filter((c) => c.estado === 'pendiente').length} pendiente(s)
                  </Text>
                </View>
              </View>

              {loadingMisEnviados ? (
                <View style={styles.skeletonGrid}>
                  {[1, 2, 3].map((n) => (
                    <SkeletonCard key={n} />
                  ))}
                </View>
              ) : misEnviados.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No has enviado solicitudes</Text>
                  <Text style={styles.emptyDesc}>
                    Cuando contactes a un propietario, tu solicitud aparecerá aquí con su estado.
                  </Text>
                </View>
              ) : (
                <View style={styles.contactosList}>
                  {misEnviados.map((contacto) => (
                    <View key={contacto.id} style={styles.contactoCard}>
                      <View style={styles.contactoHeader}>
                        <View style={styles.contactoAvatar}>
                          <Ionicons name="home-outline" size={18} color="#4361ee" />
                        </View>
                        <View style={styles.contactoHeaderText}>
                          <Text style={styles.contactoNombre}>
                            {contacto.propiedad?.titulo || 'Propiedad'}
                          </Text>
                          <Text style={styles.contactoPropiedad}>
                            {contacto.propiedad?.propietario?.full_name
                              ? `Propietario: ${contacto.propiedad.propietario.full_name}`
                              : 'Propietario'}
                          </Text>
                        </View>
                        <View style={[styles.contactoEstadoBadge, contacto.estado === 'pendiente' && styles.contactoEstadoPendiente, contacto.estado === 'aprobado' && styles.contactoEstadoAprobado, contacto.estado === 'rechazado' && styles.contactoEstadoRechazado]}>
                          <Text style={styles.contactoEstadoText}>{contacto.estado}</Text>
                        </View>
                      </View>

                      {contacto.mensaje ? (
                        <Text style={styles.contactoMensaje}>"{contacto.mensaje}"</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>

    <Modal visible={showEditModal} animationType="slide">
      <FormularioScreen
        navigation={navigation}
        onClose={() => setShowEditModal(false)}
      />
    </Modal>

    <Modal visible={!!propiedadEnEdicion} animationType="slide">
      {propiedadEnEdicion && (
        <Formulario
          initialData={propiedadEnEdicion}
          user={userData}
          navigation={navigation}
          onClose={() => setPropiedadEnEdicion(null)}
          onSuccess={() => {
            setPropiedadEnEdicion(null);
            recargarPropiedades();
          }}
        />
      )}
    </Modal>
    </>
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
  propertyItem: {
    gap: 8,
  },
  ownerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  estadoBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoBadgeInactiva: {
    backgroundColor: '#fee2e2',
  },
  estadoBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  editBtn: {
    borderColor: '#c7d2fe',
  },
  editBtnText: {
    color: '#4361ee',
    fontSize: 12,
    fontWeight: '600',
  },
  pauseBtn: {
    borderColor: '#fed7aa',
  },
  pauseText: {
    color: '#d97706',
  },
  activateBtn: {
    borderColor: '#bbf7d0',
  },
  activateText: {
    color: '#16a34a',
  },
  deleteBtn: {
    borderColor: '#fecaca',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contactosList: {
    gap: 12,
  },
  blockDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 24,
  },
  contactoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  contactoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactoAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e4fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactoHeaderText: {
    flex: 1,
  },
  contactoNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2b2d42',
  },
  contactoPropiedad: {
    fontSize: 13,
    color: '#8d99ae',
    marginTop: 2,
  },
  contactoEstadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  contactoEstadoPendiente: {
    backgroundColor: '#fef3c7',
  },
  contactoEstadoAprobado: {
    backgroundColor: '#dcfce7',
  },
  contactoEstadoRechazado: {
    backgroundColor: '#fee2e2',
  },
  contactoEstadoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'capitalize',
  },
  contactoMensaje: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  contactoActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  contactoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactoAprobarBtn: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  contactoAprobarText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  contactoRechazarBtn: {
    borderColor: '#EF4444',
    backgroundColor: '#fef2f2',
  },
  contactoRechazarText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
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

  guestContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    padding: 24,
  },
  guestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2b2d42',
    marginTop: 4,
    marginBottom: 6,
  },
  guestDesc: {
    color: '#8d99ae',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  guestPrimaryBtn: {
    backgroundColor: '#4361ee',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestPrimaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  guestSecondaryBtn: {
    borderWidth: 1,
    borderColor: '#4361ee',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  guestSecondaryBtnText: { color: '#4361ee', fontSize: 15, fontWeight: '600' },
});
