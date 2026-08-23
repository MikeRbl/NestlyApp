import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useContext } from 'react';
import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import { AuthContext } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { authIntent } = useContext(AuthContext);

  return (
    <Stack.Navigator
      initialRouteName={authIntent === 'register' ? 'Registro' : 'Login'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registro" component={RegistroScreen} />
    </Stack.Navigator>
  );
}
