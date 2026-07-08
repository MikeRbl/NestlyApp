import { View, Text } from 'react-native';
import { colors } from '../theme/colors';

export default function Lista() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.cardBg }}>
      <Text style={{ color: colors.textPrimary, padding: 16 }}>Lista</Text>
    </View>
  );
}
