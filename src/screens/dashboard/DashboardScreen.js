import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Lista from '../../components/Lista';
import { colors } from '../../theme/colors';

const DATOS_MOCK = [
  { id: 1, titulo: 'Casa de Campo Familiar', ubicacion: 'Valle de Alcocer, SMA', precio: '28,000', habitaciones: 4, banos: 3, metros: 250, imagen: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop' },
  { id: 2, titulo: 'Loft Industrial Minimalista', ubicacion: 'Centro Histórico, SMA', precio: '12,500', habitaciones: 1, banos: 1, metros: 75, imagen: 'https://images.unsplash.com/photo-11600596542815-ffad4c1539a9?q=80&w=1000&auto=format&fit=crop' },
  { id: 3, titulo: 'Casa Rústica de Piedra', ubicacion: 'Colonia Atascadero, SMA', precio: '32,000', habitaciones: 3, banos: 2.5, metros: 190, imagen: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop' },
  { id: 4, titulo: 'Depa Céntrico Ejecutivo', ubicacion: 'Zona Centro, SMA', precio: '15,000', habitaciones: 2, banos: 1, metros: 85, imagen: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000&auto=format&fit=crop' },
  { id: 5, titulo: 'Cabaña de Campo Confortable', ubicacion: 'Los Rodríguez, SMA', precio: '19,000', habitaciones: 2, banos: 2, metros: 110, imagen: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=1000&auto=format&fit=crop' },
  { id: 6, titulo: 'Depa Rústico Con Encanto', ubicacion: 'Barrio de San Juan de Dios, SMA', precio: '14,000', habitaciones: 1, banos: 1, metros: 65, imagen: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000&auto=format&fit=crop' },
  { id: 7, titulo: 'Residencia de Lujo Rústica', ubicacion: 'Club de Golf, SMA', precio: '45,000', habitaciones: 5, banos: 4, metros: 380, imagen: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000&auto=format&fit=crop' }
];

export default function DashboardScreen({ navigation }) {
  const [favoritos, setFavoritos] = useState([]);

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
        <Lista
          propiedades={DATOS_MOCK}
          onPropiedadPress={(propiedad) => navigation.navigate('Detalle', { propiedadId: propiedad.id })}
          headerComponent={renderHeaderContenido()}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
        />
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
});