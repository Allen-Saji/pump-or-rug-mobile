export const Colors = {
  pump: "#32D74B",
  pumpDim: "#28A745",
  rug: "#FF3366",
  rugDim: "#CC2952",
  dark: "#0A0A0A",
  dark100: "#141414",
  dark200: "#1C1C1E",
  dark300: "#2C2C2E",
  dark400: "#3A3A3C",
  white: "#FFFFFF",
  whiteDim: "#8E8E93",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
  void: "#8B5CF6",
  noScore: "#6B7280",
} as const;

export type GradientColors = [string, string, ...string[]];

export const Gradients: Record<string, GradientColors> = {
  cardBg: [Colors.dark100, Colors.dark100],
  headerBg: [Colors.dark, Colors.dark],
  sheetBg: [Colors.dark100, Colors.dark100],
  pumpButton: [Colors.pump, Colors.pump],
  rugButton: [Colors.rug, Colors.rug],
  goldRank: ["#FFD70020", Colors.dark100],
  silverRank: ["#C0C0C020", Colors.dark100],
  bronzeRank: ["#CD7F3220", Colors.dark100],
};

export const Fonts = {
  mono: "SpaceMono",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
