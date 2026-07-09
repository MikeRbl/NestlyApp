import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function PropiedadCard({ propiedad, onPress, esFavorito, onToggleFavorito }) {
  if (!propiedad) return null;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.95} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: propiedad?.imagen }} style={styles.image} />
        <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.7} onPress={onToggleFavorito}>
          <Ionicons
            name={esFavorito ? 'heart' : 'heart-outline'}
            size={22}
            color="#FF3B30"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.location} numberOfLines={1}>{propiedad?.ubicacion}</Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>{propiedad?.titulo}</Text>

        <View style={styles.amenitiesRow}>
          <View style={styles.amenityItem}>
            <Ionicons name="bed-outline" size={15} color={colors.iconDefault} />
            <Text style={styles.amenityText}>{propiedad?.habitaciones}</Text>
          </View>
          <View style={styles.amenityItem}>
            <Ionicons name="water-outline" size={15} color={colors.iconDefault} />
            <Text style={styles.amenityText}>{propiedad?.banos}</Text>
          </View>
          <View style={styles.amenityItem}>
            <Ionicons name="resize-outline" size={15} color={colors.iconDefault} />
            <Text style={styles.amenityText}>{propiedad?.metros} m²</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.priceRow}>
            <Ionicons name="cash-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.price}>${propiedad?.precio}</Text>
            <Text style={styles.perMonth}>/mes</Text>
          </View>
          <TouchableOpacity onPress={onToggleFavorito} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons
              name={esFavorito ? 'heart' : 'heart-outline'}
              size={22}
              color={esFavorito ? '#FF3B30' : colors.iconDefault}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 10,
    overflow: 'hidden',
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.cardBg,
    padding: 8,
    borderRadius: 20,
    elevation: 3,
  },
  infoContainer: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: colors.cardBg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  amenitiesRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 14,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  amenityText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.inputBg,
    paddingTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  perMonth: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});