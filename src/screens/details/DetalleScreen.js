import { useRoute, useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import Carrusel from '../../components/Carrusel';

export default function DetalleScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const propiedad = route.params?.propiedad;

  if (!propiedad) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No se encontró la propiedad.</Text>
      </View>
    );
  }

  function renderFeature(label, value) {
    return (
      <View style={styles.featureItem}>
        <Text style={styles.featureValue}>{value}</Text>
        <Text style={styles.featureLabel}>{label}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.backHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
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

        <TouchableOpacity style={styles.contactButton} activeOpacity={0.8}>
          <Text style={styles.contactButtonText}>Contactar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
});
