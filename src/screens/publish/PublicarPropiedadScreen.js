import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import Formulario from '../../components/Formulario';

export default function PublicarPropiedadScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

  return (
    <Formulario
      onClose={() => navigation.navigate('Explorar')}
      user={user}
      navigation={navigation}
    />
  );
}
