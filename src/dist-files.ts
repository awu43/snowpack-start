import path = require("path");

const DIST_FILES = new Map(Object.entries({
  gitignore: "gitignore.txt",
  resolveProxyImports: "resolveProxyImports-plugin.js",

  gpl: "license/GPL",
  mit: "license/MIT",
  apache: "license/Apache",

  svelteConfig: "config/svelte.config.js",
  prettierConfig: "config/.prettierrc",
  postcssConfig: "config/postcss.config.js",
  wtrConfig: "config/web-test-runner.config.js",
  jestSetup: "config/jest.setup.js",
  jestConfig: "config/jest.config.js",
  jestBabel: "config/babel.config.json",
  snowpackConfig: "config/snowpack.config.mjs",
}));

for (const [baseKey, basePath] of DIST_FILES.entries()) {
  const filePath = path.join(
    path.dirname(__dirname), "dist-files", basePath
  );
  DIST_FILES.set(baseKey, filePath);
}

export = DIST_FILES as DistPathMap;
