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
    <TouchableOpacity onPress={goToSettings} activeOpacity={0.7}>
      <View
        className="p-2 rounded-full"
        style={{ backgroundColor: colors.surface }}
      >
        <Ionicons name="settings" size={24} color={colors.textPrimary} />
      </View>
    </TouchableOpacity>
  );
}
