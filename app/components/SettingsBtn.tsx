import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsButton() {
  const { colors } = useTheme();
  const router = useRouter();

  const goToSettings = () => {
    router.push('/settings');
  };

  return (
    <TouchableOpacity
      onPress={goToSettings}
      activeOpacity={0.7}
      className="p-2 rounded-xl"
      style={{
        backgroundColor: `${colors.primary}10`,
      }}
    >
      <Ionicons name="settings-outline" size={22} color={colors.primary} />
    </TouchableOpacity>
  );
}
