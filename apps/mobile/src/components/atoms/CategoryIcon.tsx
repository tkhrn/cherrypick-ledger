import {
  IconArrowDownLeft, IconArrowsExchange, IconBus, IconCoffee, IconDots, IconGift, IconHeartbeat, IconHelp, IconHome,
  IconMovie, IconShoppingBag, IconToolsKitchen2, IconUsers, type Icon,
} from '@tabler/icons-react-native';
import { StyleSheet, View } from 'react-native';
import { ICON_CIRCLE, type CategoryColorToken } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const ICONS: Record<string, Icon> = {
  'tools-kitchen-2': IconToolsKitchen2,
  coffee: IconCoffee,
  bus: IconBus,
  'shopping-bag': IconShoppingBag,
  home: IconHome,
  heartbeat: IconHeartbeat,
  movie: IconMovie,
  gift: IconGift,
  dots: IconDots,
  'arrows-exchange': IconArrowsExchange,
  'arrow-down-left': IconArrowDownLeft,
  users: IconUsers,
  help: IconHelp,
};

export const CATEGORY_ICON_NAMES = Object.keys(ICONS);

interface CategoryIconProps {
  icon: string;
  colorToken: CategoryColorToken;
  size?: number;
}

const ICON_RATIO = 0.56;

export function CategoryIcon({ icon, colorToken, size = ICON_CIRCLE }: CategoryIconProps) {
  const { categories } = useTheme();
  const tone = categories[colorToken];
  const Glyph = ICONS[icon] ?? IconDots;
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: tone.bg }]}>
      <Glyph size={Math.round(size * ICON_RATIO)} color={tone.fg} />
    </View>
  );
}

const styles = StyleSheet.create({ circle: { alignItems: 'center', justifyContent: 'center' } });
