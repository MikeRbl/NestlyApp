import { View, Text } from 'react-native';
import { colors } from '../theme/colors';

export default function Carrusel() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.textSecondary }}>Carrusel</Text>
    </View>
  );
}
