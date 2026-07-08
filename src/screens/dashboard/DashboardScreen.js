import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';

export default function DashboardScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.inputBg }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Dashboard</Text>
    </View>
  );
}
