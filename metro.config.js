const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Privy SDK uses .mjs imports that Metro needs to resolve
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), "mjs", "cjs"];

// Block server directory from Metro bundling (server-only code)
config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  new RegExp(path.resolve(__dirname, "server") + "/.*"),
];

// Privy's jose v4 resolves to node/esm build which requires Node "crypto".
// Force it to the browser build which uses WebCrypto instead.
const privyJoseNodeDir = path.join(
  __dirname,
  "node_modules/@privy-io/js-sdk-core/node_modules/jose/dist/node"
);
const privyJoseBrowserDir = path.join(
  __dirname,
  "node_modules/@privy-io/js-sdk-core/node_modules/jose/dist/browser"
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // If the importing file is inside jose's node/ directory, redirect to browser/
  if (
    context.originModulePath &&
    context.originModulePath.startsWith(privyJoseNodeDir)
  ) {
    const browserPath = context.originModulePath.replace(
      "/jose/dist/node/esm/",
      "/jose/dist/browser/"
    ).replace(
      "/jose/dist/node/cjs/",
      "/jose/dist/browser/"
    );
    return context.resolveRequest(
      { ...context, originModulePath: browserPath },
      moduleName,
      platform
    );
  }

  // When jose itself is imported, resolve to browser entry
  if (moduleName === "jose") {
    // Check if it's being required from Privy
    if (
      context.originModulePath &&
      context.originModulePath.includes("@privy-io/")
    ) {
      return {
        type: "sourceFile",
        filePath: path.join(privyJoseBrowserDir, "index.js"),
      };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
