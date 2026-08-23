import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import PerfilScreen from '../screens/PerfilScreen';
import ExplorarPropiedadesScreen from '../screens/explorar/ExplorarPropiedadesScreen';
import PublicarPropiedadScreen from '../screens/publish/PublicarPropiedadScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
      <DashboardStack.Screen name="ExplorarPropiedades" component={ExplorarPropiedadesScreen} />
    </DashboardStack.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.cardBg, borderTopColor: colors.inputBg },
      }}
    >
      <Tab.Screen name="Explorar" component={DashboardStackNavigator} />
      <Tab.Screen name="Publicar" component={PublicarPropiedadScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

//correcion en maintabnavigator
