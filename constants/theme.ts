export const Colors = {
  pump: "#00FF88",
  pumpDim: "#00CC6A",
  rug: "#FF3366",
  rugDim: "#CC2952",
  dark: "#0A0A0A",
  dark100: "#1A1A1A",
  dark200: "#2A2A2A",
  dark300: "#3A3A3A",
  white: "#FFFFFF",
  whiteDim: "#AAAAAA",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
  void: "#8B5CF6",
  noScore: "#6B7280",
} as const;

export type GradientColors = [string, string, ...string[]];

export const Gradients: Record<string, GradientColors> = {
  cardBg: ["#1A1A1A", "#111111"],
  pumpGlow: ["#00FF8800", "#00FF8820", "#00FF8800"],
  rugGlow: ["#FF336600", "#FF336620", "#FF336600"],
  headerBg: ["#0A0A0A", "#0F1A14"],
  sheetBg: ["#1E1E2A", "#141418"],
  pumpButton: ["#00DD77", "#00FF88", "#00DD77"],
  rugButton: ["#DD2255", "#FF3366", "#DD2255"],
  goldRank: ["#FFD70020", "#1A1A1A"],
  silverRank: ["#C0C0C020", "#1A1A1A"],
  bronzeRank: ["#CD7F3220", "#1A1A1A"],
};

export const Glows = {
  pump: {
    shadowColor: "#00FF88",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  pumpSubtle: {
    shadowColor: "#00FF88",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  rug: {
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  rugSubtle: {
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gold: {
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

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
