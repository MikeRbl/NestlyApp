import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';

export default function RegistroScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.inputBg }}>
      <View
        style={{
          width: '85%',
          backgroundColor: colors.cardBg,
          borderRadius: 16,
          padding: 32,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 24 }}>
          Registro
        </Text>
      </View>
    </View>
  );
}
