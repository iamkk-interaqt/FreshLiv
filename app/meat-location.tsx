import { Redirect } from 'expo-router';

export default function MeatLocationScreen() {
  return <Redirect href={{ pathname: '/location', params: { vertical: 'MEAT' } }} />;
}
