import { View, Text } from 'react-native';
import { colors } from '../theme/colors';

export default function PropiedadCard() {
  return (
    <View
      style={{
        padding: 16,
        backgroundColor: colors.cardBg,
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
      }}
    >
      <Text style={{ color: colors.textPrimary }}>PropiedadCard</Text>
    </View>
  );
}
