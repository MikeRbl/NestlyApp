import React, { useState, useCallback } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import Carrusel from '../../components/Carrusel';
import Formulario from '../../components/Formulario';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { getPropiedad, eliminarPropiedad, enviarContacto } from '../../services/api';

export default function DetalleScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { favoritosIds, toggleFavorito, user, isGuest, exitGuestMode } = useAuth();
  const propiedadParam = route.params?.propiedad;

  const [propiedad, setPropiedad] = useState(propiedadParam || null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  const propiedadId = propiedadParam?.id ?? propiedadParam?.id_propiedad;

  const fetchPropiedad = useCallback(async () => {
    if (!propiedadId) return;
    try {
      const res = await getPropiedad(propiedadId);
      if (res?.data) setPropiedad(res.data);
    } catch (err) {
      console.error('Error al cargar la propiedad:', err);
    }
  }, [propiedadId]);

  useFocusEffect(
    useCallback(() => {
      fetchPropiedad();
    }, [fetchPropiedad])
  );

  if (!propiedad) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No se encontró la propiedad.</Text>
      </View>
    );
  }

  const idResuelto = propiedad.id ?? propiedad.id_propiedad;
  const esPropietario =
    !!user?.id &&
    !user?.isGuest &&
    propiedad.id_propietario != null &&
    Number(user.id) === Number(propiedad.id_propietario);
  const esFavorito = favoritosIds.includes(idResuelto);

  function renderFeature(label, value) {
    return (
      <View style={styles.featureItem}>
        <Text style={styles.featureValue}>{value}</Text>
        <Text style={styles.featureLabel}>{label}</Text>
      </View>
    );
  }

  const handleContactar = () => {
    if (isGuest) {
      Alert.alert(
        'Para continuar',
        'Para contactar al propietario, regístrate o inicia sesión.',
        [
          { text: 'Crear Cuenta', onPress: () => exitGuestMode('register') },
          { text: 'Iniciar Sesión', onPress: () => exitGuestMode('login') },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }
    setContactMessage('');
    setShowContactModal(true);
  };

  const enviarSolicitudContacto = async () => {
    if (!idResuelto) return;
    setIsSendingContact(true);
    try {
      await enviarContacto(idResuelto, contactMessage.trim() || null);
      setShowContactModal(false);
      Toast.show({
        type: 'success',
        text1: 'Solicitud enviada',
        text2: 'Se notificó al propietario para que la apruebe.',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.error?.message || err.message || 'No se pudo enviar la solicitud.',
      });
    } finally {
      setIsSendingContact(false);
    }
  };

  const handleEliminar = () => {
    Alert.alert(
      'Eliminar propiedad',
      '¿Seguro que deseas eliminar esta propiedad? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await eliminarPropiedad(idResuelto);
              Toast.show({ type: 'success', text1: 'Propiedad eliminada correctamente.' });
              navigation.goBack();
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: err.error?.message || err.message || 'No se pudo eliminar la propiedad.',
              });
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.backHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleFavorito(idResuelto)} style={styles.favoriteButton} activeOpacity={0.7}>
            <Ionicons name={esFavorito ? 'heart' : 'heart-outline'} size={28} color={esFavorito ? '#FF3B30' : colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <Carrusel images={propiedad.fotos_url || propiedad.fotos || []} height={280} />

        <View style={styles.content}>
          <Text style={styles.price}>
            ${Number(propiedad.precio).toLocaleString('es-MX')} MXN
          </Text>
          <Text style={styles.title}>{propiedad.titulo}</Text>
          <Text style={styles.address}>
            {propiedad.direccion}
            {propiedad.ciudad ? `, ${propiedad.ciudad}` : ''}
            {propiedad.estado_ubicacion ? `, ${propiedad.estado_ubicacion}` : ''}
          </Text>

          {propiedad.tipo_propiedad?.nombre && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{propiedad.tipo_propiedad.nombre}</Text>
            </View>
          )}

          {propiedad.estado_propiedad && (
            <View style={[styles.badge, styles.estadoBadge]}>
              <Text style={[styles.badgeText, styles.estadoBadgeText]}>{propiedad.estado_propiedad}</Text>
            </View>
          )}

          <View style={styles.featuresGrid}>
            {renderFeature('Habitaciones', propiedad.habitaciones ?? '-')}
            {renderFeature('Baños', propiedad.banos ?? '-')}
            {renderFeature('m²', propiedad.metros_cuadrados ?? '-')}
            {renderFeature('Mascotas', propiedad.mascotas === true || propiedad.mascotas === 'si' || propiedad.mascotas === 1 ? 'Sí' : 'No')}
            {renderFeature('Amueblado', propiedad.amueblado ? 'Sí' : 'No')}
            {renderFeature('Anual', propiedad.anualizado ? 'Sí' : 'No')}
          </View>

          {propiedad.deposito > 0 && (
            <Text style={styles.depositText}>
              Depósito: ${Number(propiedad.deposito).toLocaleString('es-MX')} MXN
            </Text>
          )}

          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{propiedad.descripcion}</Text>

          <Text style={styles.sectionTitle}>Contacto</Text>
          <Text style={styles.contactText}>Email: {propiedad.email}</Text>
          <Text style={styles.contactText}>Teléfono: {propiedad.telefono}</Text>

          {!esPropietario && (
            <TouchableOpacity style={styles.contactButton} activeOpacity={0.8} onPress={handleContactar}>
              <Text style={styles.contactButtonText}>Contactar</Text>
            </TouchableOpacity>
          )}

          {esPropietario && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={[styles.ownerBtn, styles.editBtn]}
                activeOpacity={0.8}
                onPress={() => setShowEditModal(true)}
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <Text style={styles.ownerBtnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ownerBtn, styles.deleteBtn]}
                activeOpacity={0.8}
                onPress={handleEliminar}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                )}
                <Text style={[styles.ownerBtnText, styles.ownerBtnTextDanger]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showEditModal} animationType="slide">
        {showEditModal && (
          <Formulario
            initialData={propiedad}
            user={user}
            navigation={navigation}
            onClose={() => setShowEditModal(false)}
            onSuccess={fetchPropiedad}
          />
        )}
      </Modal>

      <Modal visible={showContactModal} transparent animationType="fade">
        <View style={styles.contactOverlay}>
          <View style={styles.contactModal}>
            <Text style={styles.contactModalTitle}>Contactar al propietario</Text>
            <Text style={styles.contactModalDesc}>
              Envía un mensaje al propietario. Se le notificará para que lo apruebe.
            </Text>
            <TextInput
              style={styles.contactInput}
              placeholder="Escribe tu mensaje (opcional)"
              placeholderTextColor={colors.textSecondary}
              value={contactMessage}
              onChangeText={setContactMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.contactSendBtn, isSendingContact && styles.contactSendBtnDisabled]}
              activeOpacity={0.8}
              onPress={enviarSolicitudContacto}
              disabled={isSendingContact}
            >
              {isSendingContact ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.contactSendBtnText}>Enviar solicitud</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactCancelBtn}
              activeOpacity={0.8}
              onPress={() => setShowContactModal(false)}
            >
              <Text style={styles.contactCancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.inputBg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    padding: 20,
  },
  price: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  address: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  estadoBadge: {
    backgroundColor: '#E0E4FC',
    marginLeft: 8,
  },
  estadoBadgeText: {
    color: colors.primary,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  featureItem: {
    width: '30%',
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  featureValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  featureLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  depositText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  description: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  contactText: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  backHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  contactButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 24,
  },
  ownerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 10,
  },
  editBtn: {
    backgroundColor: colors.primary,
  },
  deleteBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  ownerBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  ownerBtnTextDanger: {
    color: '#EF4444',
  },
  contactOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  contactModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  contactModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  contactModalDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  contactInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 90,
    marginBottom: 16,
    backgroundColor: '#FFF',
  },
  contactSendBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  contactSendBtnDisabled: {
    backgroundColor: colors.textSecondary,
  },
  contactSendBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  contactCancelBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  contactCancelBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
