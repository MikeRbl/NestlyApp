import React from 'react';
import { FlatList, StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropiedadCard from './PropiedadCard';
import { colors } from '../theme/colors';

const REVIEWS_MOCK = [
  { id: 1, comentario: 'Gracias a Nestly encontré el departamento de mis sueños en menos de una semana. El proceso fue súper rápido, seguro y sin complicaciones.', nombre: 'Carlos Martínez', anio: '2024' },
  { id: 2, comentario: 'La mejor plataforma para rentar. Todo es transparente y la comunicación con el dueño fue súper directa desde el primer día.', nombre: 'Ana Sofía Ruiz', anio: '2025' },
  { id: 3, comentario: 'Me encantó la facilidad para filtrar por ubicación y precio. Definitivamente la recomiendo a todos mis amigos que buscan independizarse.', nombre: 'Miguel Ángel', anio: '2023' },
];

export default function Lista({ propiedades = [], onPropiedadPress, headerComponent, favoritos = [], onToggleFavorito }) {
  
  const renderFooter = () => (
    <View style={styles.footerWrapper}>
      <View style={styles.reviewsSection}>
        <Text style={styles.reviewsTitle}>Lo que dicen nuestros inquilinos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewsScroll}>
          {REVIEWS_MOCK.map((item) => (
            <View key={item.id} style={styles.reviewCard}>
              <Text style={styles.reviewText}>"{item.comentario}"</Text>
              <View style={styles.userContainer}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.userName}>{item.nombre}</Text>
                  <Text style={styles.tenantSince}>Inquilino desde {item.anio}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.mainFooter}>
        <View style={styles.brandSection}>
          <Text style={styles.brandName}>Nestly</Text>
          <Text style={styles.brandDescription}>Encuentra el lugar perfecto para ti. Conectamos personas con los mejores espacios.</Text>
        </View>
        <View style={styles.linksContainer}>
          <View style={styles.linkColumn}>
            <Text style={styles.columnTitle}>Compañía</Text>
            <TouchableOpacity><Text style={styles.linkText}>Acerca de nosotros</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.linkText}>Contáctanos</Text></TouchableOpacity>
          </View>
          <View style={styles.linkColumn}>
            <Text style={styles.columnTitle}>Legal</Text>
            <TouchableOpacity><Text style={styles.linkText}>Términos y condiciones</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.linkText}>Aviso de privacidad</Text></TouchableOpacity>
          </View>
        </View>
        <View style={styles.socialSection}>
          <TouchableOpacity style={styles.socialButton}><Ionicons name="logo-facebook" size={20} color="#FFFFFF" /></TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}><Ionicons name="logo-instagram" size={20} color="#FFFFFF" /></TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}><Ionicons name="logo-twitter" size={20} color="#FFFFFF" /></TouchableOpacity>
        </View>
      </View>
      <View style={styles.bottomFooter}>
        <Text style={styles.copyrightText}>© 2026 Nestly.</Text>
        <Text style={styles.copyrightText}>Todos los derechos reservados.</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={propiedades}
        keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
        renderItem={({ item }) => {
          if (!item) return null;
          return (
            <PropiedadCard 
              propiedad={item} 
              onPress={() => onPropiedadPress(item)}
              esFavorito={favoritos.includes(item.id)}
              onToggleFavorito={() => onToggleFavorito(item.id)}
            />
          );
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        ListHeaderComponent={headerComponent}
        ListFooterComponent={renderFooter()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    backgroundColor: colors.inputBg,
  },
  flatListContent: {
    paddingTop: 0,
  },
  footerWrapper: {
    width: '100%',
  },
  reviewsSection: {
    marginTop: 32,
    paddingLeft: 16,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  reviewsScroll: {
    paddingRight: 16,
  },
  reviewCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    width: 300,
    padding: 20,
    marginRight: 16,
    elevation: 3,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  reviewText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tenantSince: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  mainFooter: {
    backgroundColor: '#0B132B',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    marginTop: 32,
  },
  brandSection: {
    marginBottom: 32,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  brandDescription: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  linkColumn: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  linkText: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 16,
  },
  socialSection: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    backgroundColor: '#1C2541',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomFooter: {
    backgroundColor: '#000000',
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  copyrightText: {
    fontSize: 14,
    color: '#64748B',
  }
});