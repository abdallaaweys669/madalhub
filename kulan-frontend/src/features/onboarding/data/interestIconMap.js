// Central mapping from interest key -> vector icon spec
// This lets you switch from emojis to icons (or vice versa) without touching UI components.
// Each spec supports: { pack: 'MaterialCommunityIcons' | 'MaterialIcons' | 'FontAwesome5' | 'Ionicons' | 'Feather', name: string }

export const INTEREST_ICON_MAP = {
  // Lifestyle & Culture
  Fashion: { pack: 'FontAwesome5', name: 'tshirt' },
  Travel: { pack: 'MaterialCommunityIcons', name: 'airplane' },
  Photography: { pack: 'Feather', name: 'camera' },
  Beauty: { pack: 'MaterialCommunityIcons', name: 'lipstick' },
  Food: { pack: 'MaterialCommunityIcons', name: 'food-fork-drink' },
  'Home Decor': { pack: 'MaterialCommunityIcons', name: 'sofa' },

  // Sports & Hobbies
  Basketball: { pack: 'MaterialCommunityIcons', name: 'basketball' },
  Boxing: { pack: 'MaterialCommunityIcons', name: 'boxing-glove' },
  Tennis: { pack: 'MaterialCommunityIcons', name: 'tennis' },
  Football: { pack: 'MaterialCommunityIcons', name: 'football' },
  Rugby: { pack: 'MaterialCommunityIcons', name: 'rugby' },
  Soccer: { pack: 'MaterialCommunityIcons', name: 'soccer' },
  Running: { pack: 'MaterialCommunityIcons', name: 'run' },

  // Tech & Innovation
  Gadget: { pack: 'MaterialCommunityIcons', name: 'cellphone' },
  Blockchain: { pack: 'MaterialCommunityIcons', name: 'link-variant' },
  Web3: { pack: 'MaterialCommunityIcons', name: 'web' },
  AI: { pack: 'MaterialCommunityIcons', name: 'robot' },
  Programming: { pack: 'MaterialCommunityIcons', name: 'code-tags' },
};

