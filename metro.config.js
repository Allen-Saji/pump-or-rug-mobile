const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Privy SDK uses .mjs imports that Metro needs to resolve
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), "mjs", "cjs"];

// Force jose to resolve to browser build instead of Node ESM build
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect jose imports to browser build
  if (moduleName === "jose" || moduleName.startsWith("jose/")) {
    const browserPath = moduleName === "jose"
      ? path.resolve(__dirname, "node_modules/jose/dist/browser/index.js")
      : path.resolve(__dirname, "node_modules", moduleName.replace("jose/", "jose/dist/browser/"));

    return {
      type: "sourceFile",
      filePath: browserPath,
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
