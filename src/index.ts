#!/usr/bin/env node
/* eslint-disable no-useless-escape */
/* eslint-disable no-console */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const path = require("path");

const execa = require("execa");
const fse = require("fs-extra");

const styles = require("./styles.ts");
const { getOptions } = require("./get-options.ts");
const JS_FRAMEWORKS = require("./js-frameworks.ts");
const BASE_FILES = require("../dist-files");
const BASE_TEMPLATES = require("../dist-templates");

interface OptionSet {
  projectDir: string,
  jsFramework: string,
  typescript: boolean,
  codeFormatters: string[],
  sass: boolean,
  cssFramework: string,
  bundler: string,
  plugins: string[],
  license: string,
  author: string,

  useYarn: boolean,
  usePnpm: boolean,
  skipTailwindInit: boolean,
  skipGitInit: boolean,
  skipEslintInit: boolean,
}

// For spacing in template literals
function s(numSpaces: number) {
  return " ".repeat(numSpaces);
}

function templateName(options: OptionSet) {
  return `${options.jsFramework}${options.typescript ? "-typescript" : ""}`;
}

function fileReadAndReplace(file: string, targetStr: string, replStr: string) {
  fse.writeFileSync(
    file, fse.readFileSync(file, "utf8").replace(targetStr, replStr), "utf8"
  );
}

function generateSvelteConfig(options: OptionSet) {
  let svelteConfig = fse.readFileSync(
    BASE_FILES.get("svelteConfig"), "utf8"
  );
  if (!options.typescript) {
    svelteConfig = svelteConfig.replace(/defaults.+?},\s+/s, "");
  }
  if (options.cssFramework !== "tailwindcss") {
    svelteConfig = svelteConfig.replace(/require\('tailwindcss'\),\s+/, "");
  }
  if ((options.plugins || []).includes("postcss")
      && options.bundler === "snowpack") {
    svelteConfig = svelteConfig.replace(/\s+require\('cssnano'\),/, "");
  }
  if (!(options.plugins || []).includes("postcss")) {
    svelteConfig = svelteConfig.replace(
      new RegExp(`${s(4)}postcss.+?${s(4)}},\n`, "s"), ""
    );
  }
  if (options.typescript || (options.plugins || []).includes("postcss")) {
    fse.writeFileSync("svelte.config.js", svelteConfig);
  }
}

async function createBase(options: OptionSet) {
  console.log(`\n- Creating a new Snowpack app in ${styles.cyanBright(path.resolve(options.projectDir))}`);
  try {
    if (fse.pathExistsSync(options.projectDir)) {
      throw Error("Project directory already exists.");
    }
    fse.mkdirSync(options.projectDir, { recursive: true });
  } catch (error) {
    console.error(error);
    console.error(
      styles.fatalError("Error while creating project directory")
    );
    process.exit(1);
  }
  process.chdir(options.projectDir);

  fse.copyFileSync(BASE_FILES.get("gitignore"), ".gitignore");

  const targetTemplateDir = BASE_TEMPLATES.get(templateName(options));
  let readme = fse.readFileSync(
    path.join(targetTemplateDir, "README.md"), "utf8"
  );
  readme = readme.replace("New Project", path.basename(options.projectDir));
  if (options.useYarn) {
    readme = readme.replace(/\bnpm( run)?\b/g, "yarn");
  } else if (options.usePnpm) {
    readme = readme.replace(/\bnpm\b/g, "pnpm");
  }
  fse.writeFileSync("README.md", readme);

  fse.copySync(path.join(targetTemplateDir, "public"), "public");
  fse.copySync(path.join(targetTemplateDir, "src"), "src");

  if (options.jsFramework === "svelte") {
    generateSvelteConfig(options);
  }
  if (options.jsFramework === "lit-element") {
    fse.copyFileSync(
      path.join(targetTemplateDir, "babel.config.json"), "babel.config.json"
    );
  }

  if (options.typescript) {
    fse.copySync(path.join(targetTemplateDir, "types"), "types");
    fse.copyFileSync(
      path.join(targetTemplateDir, "tsconfig.json"), "tsconfig.json"
    );
  }

  // Optional .? chaining requires Node 14+
  if ((options.codeFormatters || []).includes("prettier")) {
    fse.copyFileSync(BASE_FILES.get("prettierConfig"), ".prettierrc");
  }

  if (options.sass) {
    const jsExt = options.typescript ? "ts" : "js";
    switch (options.jsFramework) {
      case "blank":
      case "lit-element":
        fse.renameSync("src/index.css", "src/index.scss");
        break;
      case "react":
      case "preact":
        fse.renameSync("src/App.css", "src/App.scss");
        fse.renameSync("src/index.css", "src/index.scss");
        fileReadAndReplace(`src/App.${jsExt}x`, "App.css", "App.scss");
        fileReadAndReplace(`src/index.${jsExt}x`, "index.css", "index.scss");
        break;
      default: // Vue/Svelte templates have no CSS files
        break;
    }
  }

  if ((options.plugins || []).includes("postcss")) {
    let postcssConfig = fse.readFileSync(
      BASE_FILES.get("postcssConfig"), "utf8"
    );
    if (options.bundler === "snowpack") {
      postcssConfig = postcssConfig.replace(
        /\s+process.env.NODE_ENV === 'production' \? require\('cssnano'\).+/,
        ""
      );
    }
    if (options.cssFramework !== "tailwindcss") {
      postcssConfig = postcssConfig.replace(
        /require\('tailwindcss'\),\s+/, ""
      );
    }
    fse.writeFileSync("postcss.config.js", postcssConfig);
  }
  if ((options.plugins || []).includes("wtr")) {
    fse.copyFileSync(BASE_FILES.get("wtrConfig"), "web-test-runner.config.js");
  }
  if (options.license) {
    fse.copyFileSync(BASE_FILES.get(options.license), "LICENSE");
    if (options.license === "mit") {
      fileReadAndReplace(
        "LICENSE",
        "YYYY Author",
        `${new Date().getFullYear()} ${options.author}`,
      );
    }
  }
}

const DEFAULT_BROWSERSLIST = {
  production: [
    "defaults",
    "not ie 11",
    "not op_mini all",
  ],
  development: [
    "last 1 chrome version",
    "last 1 firefox version",
    "last 1 safari version",
    "last 1 edge version",
  ]
};

interface PackageJson {
  [key: string]: any;
}
function generatePackageJson(options: OptionSet) {
  const appPackageJson: PackageJson = {
    private: true,
    scripts: {
      start: "snowpack dev",
      build: "snowpack build",
      // eslint-disable-next-line quotes
      test: 'echo \"This template does not include a test runner by default.\" && exit 1',
    },
  };

  const jsExts = ["js"];
  if (["react", "preact"].includes(options.jsFramework)) {
    jsExts.push("jsx");
  } else if (options.jsFramework === "vue") {
    jsExts.unshift("vue");
  } else if (options.jsFramework === "svelte") {
    jsExts.unshift("svelte");
  }
  if (options.typescript) {
    if (options.jsFramework === "blank") {
      jsExts.unshift("ts");
    } else {
      jsExts.push("ts");
    }
    if (["react", "preact"].includes(options.jsFramework)) {
      jsExts.push("tsx");
    } else if (options.jsFramework === "lit-element") {
      jsExts.shift();
    }
  }
  const fmtExts = (
    jsExts.length > 1 ? `{${jsExts.join(",")}}` : jsExts.toString()
  );

  const eslintFormat = `eslint --fix \"src/**/*.${fmtExts}\"`;
  const eslintLint = `eslint \"src/**/*.${fmtExts}\"`;
  const prettierFormat = `prettier --write \"src/**/*.${fmtExts}\"`;
  const prettierLint = `prettier --check \"src/**/*.${fmtExts}\"`;

  const useEslint = (options.codeFormatters || []).includes("eslint");
  const usePrettier = (options.codeFormatters || []).includes("prettier");
  if (useEslint && !usePrettier) {
    appPackageJson.scripts.format = eslintFormat;
    appPackageJson.scripts.lint = eslintLint;
  } else if (!useEslint && usePrettier) {
    appPackageJson.scripts.format = prettierFormat;
    appPackageJson.scripts.lint = prettierLint;
  } else if (useEslint && usePrettier) {
    appPackageJson.scripts.esfix = eslintFormat;
    appPackageJson.scripts.eslint = eslintLint;
    appPackageJson.scripts.pwrite = prettierFormat;
    appPackageJson.scripts.pcheck = prettierLint;
  }

  if (options.jsFramework === "vue" && options.typescript) {
    appPackageJson.scripts["type-check"] = "tsc";
  }

  if (options.bundler === "webpack"
      || (options.plugins || []).includes("postcss")) {
    appPackageJson.browserslist = DEFAULT_BROWSERSLIST;
  }

  // No example tests for Vue/LitElement
  if ((options.plugins || []).includes("wtr")
      && !["vue", "lit-element"].includes(options.jsFramework)) {
    let jsTestExt = options.typescript ? "ts" : "js";
    if (["react", "preact"].includes(options.jsFramework)) {
      jsTestExt = `${jsTestExt}x`;
    }
    appPackageJson.scripts.test = `web-test-runner \"src/**/*.test.${jsTestExt}\"`;
  }

  fse.writeFileSync("package.json", JSON.stringify(appPackageJson, null, 2));
}

const PLUGIN_PACKAGES = new Map(Object.entries({
  postcss: [
    "postcss",
    "postcss-cli",
    "postcss-preset-env",
    // "cssnano", // Added later conditionally
    "@snowpack/plugin-postcss",
  ],
  wtr: [
    "@web/test-runner",
    "chai",
    "@snowpack/web-test-runner-plugin",
  ],
  srs: ["@snowpack/plugin-run-script"],
  sbs: ["@snowpack/plugin-build-script"],
}));

const MAJOR_VERSION_REGEX = /(\d+)\.\d+\.\d+/;
function packageMajorVersion(version: string) {
  return MAJOR_VERSION_REGEX.exec(version)![1];
}

function installPackages(options: OptionSet) {
  const prodPackages = [];
  const devPackages = ["snowpack"];

  const jsFramework = JS_FRAMEWORKS.get(options.jsFramework);
  prodPackages.push(...jsFramework.prodPackages);
  devPackages.push(...jsFramework.devPackages);
  if (options.typescript) {
    devPackages.push(...jsFramework.tsPackages);
  }
  if ((options.plugins || []).includes("wtr")) {
    devPackages.push(...jsFramework.wtrPackages);
  }

  if (["react", "svelte", "preact"].includes(options.jsFramework)
      && options.typescript && (options.plugins || []).includes("wtr")) {
    devPackages.push("@types/mocha");
  }

  if (options.typescript) {
    devPackages.push(...[
      "typescript",
      "@snowpack/plugin-typescript",
      "@types/snowpack-env",
    ]);
    if (options.jsFramework === "vue") {
      devPackages.pop(); // Remove @types/snowpack-env
      devPackages.pop(); // Remove @snowpack/plugin-typescript
    } else if (options.jsFramework === "preact") {
      devPackages.pop(); // Remove @types/snowpack-env
    }
    if ((options.plugins || []).includes("wtr")) {
      devPackages.push("@types/chai");
    }
  }

  devPackages.push(...(options.codeFormatters || []));

  if (options.sass) {
    devPackages.push("@snowpack/plugin-sass");
  }

  if (options.cssFramework) {
    devPackages.push(options.cssFramework);
  }

  if (options.bundler === "webpack") {
    devPackages.push("@snowpack/plugin-webpack");
  }

  for (const plugin of options.plugins || []) {
    devPackages.push(...(PLUGIN_PACKAGES.get(plugin) as string[]));
  }
  if ((options.plugins || []).includes("postcss")) {
    if (options.bundler !== "snowpack") {
      devPackages.push("cssnano");
    }
    if (options.jsFramework === "svelte"
        && options.cssFramework === "tailwindcss") {
      devPackages.push("svelte-preprocess");
    }
  }

  const basePackageJson = require(
    path.join(BASE_TEMPLATES.get(templateName(options)), "package.json")
  );
  if (prodPackages.length && basePackageJson.dependencies) {
    prodPackages.forEach((pkg, i) => {
      if (pkg in basePackageJson.dependencies) {
        const version = basePackageJson.dependencies[pkg];
        prodPackages[i] = `${pkg}@${packageMajorVersion(version)}`;
      }
    });
  }
  if (devPackages.length && basePackageJson.devDependencies) {
    devPackages.forEach((pkg, i) => {
      if (pkg in basePackageJson.devDependencies) {
        const version = basePackageJson.devDependencies[pkg];
        devPackages[i] = `${pkg}@${packageMajorVersion(version)}`;
      }
    });
  }

  console.log(styles.cyanBright("\n- Installing package dependencies. This might take a couple of minutes."));
  let cmd;
  if (options.useYarn) {
    cmd = ["yarn", "add"];
  } else if (options.usePnpm) {
    cmd = ["pnpm", "add"];
  } else {
    cmd = ["npm", "install"];
  }
  if (prodPackages.length) {
    execa.sync(cmd[0], [cmd[1], ...prodPackages], { stdio: "inherit" });
  }
  execa.sync(cmd[0], [cmd[1], "-D", ...devPackages], { stdio: "inherit" });
}

// ['plugin', {
//
// }]
// function blankPluginConfig(plugin) {
//   return `['${plugin}', {
// ${s(6)}
// ${s(4)}}]`;
// }

const TS_PLUGIN_CONFIG = `['@snowpack/plugin-typescript', {
${s(6)}// Yarn PnP workaround
${s(6)}// https://www.npmjs.com/package/@snowpack/plugin-typescript
${s(6)}...(process.versions.pnp ? { tsc: 'yarn pnpify tsc' } : {}),
${s(4)}}]`;

const SRS_CONFIG = `['@snowpack/plugin-run-script', {
${s(6)}cmd: 'echo \"production build command.\"',
${s(6)}watch: 'echo \"dev server command.\"', // (optional)
${s(4)}}]`;

const SBS_CONFIG = `['@snowpack/plugin-build-script', {
${s(6)}input: [], // files to watch
${s(6)}output: [], // files to export
${s(6)}cmd: 'echo \"build command.\"', // cmd to run
${s(4)}}]`;

const SNOWPACK_CONFIG_PLUGINS = new Map(Object.entries({
  webpack: "'@snowpack/plugin-webpack'",
  postcss: "'@snowpack/plugin-postcss'",
  srs: SRS_CONFIG,
  sbs: SBS_CONFIG,
}));

const DEFAULT_BUILTIN_BUNDLER_SETTINGS = [
  "bundle: true",
  "minify: true",
  "target: 'es2017'",
];

// For Preact template
const PREACT_ALIAS = `
${s(2)}alias: {
${s(4)}/* ... */
${s(2)}},
`;

function generateSnowpackConfig(options: OptionSet) {
  let snowpackConfig = fse.readFileSync(
    BASE_FILES.get("snowpackConfig"), "utf8"
  );

  const configPluginsList = [...JS_FRAMEWORKS.get(options.jsFramework).plugins];
  if (options.jsFramework === "preact" && options.typescript) {
    configPluginsList.reverse();
  }

  if (options.jsFramework === "preact" && !options.typescript) {
    snowpackConfig = snowpackConfig.replace(
      /(buildOptions.+},\n)/s, `$1${PREACT_ALIAS}`
    );
  }

  if (options.typescript) {
    if (options.jsFramework === "vue") {
      configPluginsList.splice(
        1, 0, "'@snowpack/plugin-vue/plugin-tsx-jsx.js'"
      );
    } else {
      configPluginsList.push(TS_PLUGIN_CONFIG);
    }
  }

  if (options.sass) {
    configPluginsList.push("'@snowpack/plugin-sass'");
  }

  if (SNOWPACK_CONFIG_PLUGINS.has(options.bundler)) {
    configPluginsList.push(SNOWPACK_CONFIG_PLUGINS.get(options.bundler));
  } else if (options.bundler === "snowpack") {
    const builtinSettings = (
      DEFAULT_BUILTIN_BUNDLER_SETTINGS
        .map(setting => `${s(4)}${setting},\n`).join("")
    );
    snowpackConfig = snowpackConfig.replace(
      /(optimize: {\n)\s+\/\*.+?\n(\s+},)/s, `$1${builtinSettings}$2`
    );
    // /* ... */ -> content
  }

  for (const plugin of options.plugins || []) {
    if (SNOWPACK_CONFIG_PLUGINS.has(plugin)) {
      configPluginsList.push(SNOWPACK_CONFIG_PLUGINS.get(plugin));
    }
  }

  if (configPluginsList.length) {
    const configPluginsStr = (
      configPluginsList.map(plugin => `${s(4)}${plugin},\n`).join("")
    );
    snowpackConfig = snowpackConfig.replace(
      /(plugins: \[\n)\s+\/\*.+?\n(\s+\],)/s, `$1${configPluginsStr}$2`
    );
  }

  fse.writeFileSync("snowpack.config.js", snowpackConfig);
}

function initializeTailwind(options: OptionSet) {
  if (options.cssFramework === "tailwindcss") {
    if (options.skipTailwindInit) {
      console.log(styles.warningMsg("\n- Skipping TailwindCSS init.\n"));
    } else {
      try {
        console.log(styles.cyanBright("\n- Generating tailwind.config.js."));
        execa.sync("npx", ["tailwindcss", "init"], { stdio: "inherit" });
        console.log(`\n  - ${styles.successMsg("Success!\n")}`);
      } catch (error) {
        console.error(error);
        console.error(`\n  - ${styles.warningMsg("Something went wrong.\n")}`);
      }
    }
  }
}

function initializeEslint(options: OptionSet) {
  if ((options.codeFormatters || []).includes("eslint")) {
    if (!options.skipEslintInit) {
      try {
        console.log(styles.cyanBright("\n- Initializing ESLint.\n"));
        execa.sync("npx", ["eslint", "--init"], { stdio: "inherit" });
      } catch (error) {
        console.error(error);
        console.error(`\n  - ${styles.warningMsg("Something went wrong.\n")}`);
      }
    } else {
      console.log(styles.warningMsg("\n- Skipping ESLint init.\n"));
    }
  }
}

function initializeGit(options: OptionSet) {
  if (!options.skipGitInit) {
    console.log(styles.cyanBright("\n- Initializing git repo.\n"));
    try {
      execa.sync("git", ["init"], { stdio: "inherit" });
      execa.sync("git", ["add", "-A"], { stdio: "inherit" });
      execa.sync(
        "git", ["commit", "-m", "\"Intial commit\""], { stdio: "inherit" }
      );
      console.log(`\n  - ${styles.successMsg("Success!\n")}`);
    } catch (error) {
      console.error(error);
      console.error(`\n  - ${styles.warningMsg("Something went wrong.\n")}`);
    }
  } else {
    console.log(styles.warningMsg("\n- Skipping git init.\n"));
  }
}

// From create-snowpack-app
function formatCommand(command: string, description: string) {
  return `${s(2)}${command.padEnd(17)}${description}`;
}

function displayQuickstart(options: OptionSet, startDir: string) {
  let installer;
  if (options.useYarn) {
    installer = "yarn";
  } else if (options.usePnpm) {
    installer = "pnpm";
  } else {
    installer = "npm";
  }
  // Also from create-snowpack-app
  console.log("");
  console.log(styles.boldUl("Quickstart:"));
  console.log("");
  console.log(`  cd ${path.relative(startDir, process.cwd())}`);
  console.log(`  ${installer} start`);
  console.log("");
  console.log(styles.boldUl("All Commands:"));
  console.log("");
  console.log(
    formatCommand(`${installer} start`, "Start your development server.")
  );
  console.log(
    formatCommand(
      `${installer}${!options.useYarn ? " run" : ""} build`,
      "Build your website for production."
    )
  );
  console.log(
    formatCommand(`${installer} test`, "Run your tests.")
  );
  console.log("");
}

function nodeVersionCheck() {
  const currentMajorVersion = parseInt(process.versions.node.split(".")[0], 10);
  const minimumMajorVersion = 10;
  if (currentMajorVersion < minimumMajorVersion) {
    console.error(
      styles.fatalError(`Node v${currentMajorVersion} is unsupported.`)
    );
    console.error(
      styles.errorMsg(`Please use Node v${minimumMajorVersion} or higher.`)
    );
    process.exit(1);
  }
}

async function main() {
  nodeVersionCheck();

  const startDir = process.cwd();
  const options = await getOptions();
  await createBase(options);
  generatePackageJson(options);
  installPackages(options);
  generateSnowpackConfig(options);

  initializeTailwind(options);
  initializeEslint(options);
  initializeGit(options);

  displayQuickstart(options, startDir);
}

if (require.main === module) {
  main();
}

module.exports = {
  _testing: {
    s,
    templateName,
    fileReadAndReplace,
    generateSvelteConfig,
    createBase,
    DEFAULT_BROWSERSLIST,
    generatePackageJson,
    packageMajorVersion,
    installPackages,
    generateSnowpackConfig,
    initializeTailwind,
    initializeEslint,
    initializeGit,
    formatCommand,
    displayQuickstart,
    nodeVersionCheck,
  },
};
