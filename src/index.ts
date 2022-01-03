#!/usr/bin/env node
/* eslint-disable no-useless-escape */
import path = require("path");

import execa = require("execa");
import fse = require("fs-extra");

import styles = require("./styles");
import _getOptions = require("./get-options");
import BASE_TEMPLATES = require("./base-templates");
import DIST_FILES = require("./dist-files");
import DIST_TEMPLATES = require("./dist-templates");

const { getOptions } = _getOptions;

const REACT_TEMPLATES = ["react", "react-redux", "preact"];

// For spacing in template literals
function s(numSpaces: number): string {
  return " ".repeat(numSpaces);
}

function templateName(options: FullOptionSet): string {
  return `${options.baseTemplate}${options.typescript ? "-typescript" : ""}`;
}

function fileReadAndReplace(
  file: string,
  targetStr: string | RegExp,
  replStr: string,
): void {
  fse.writeFileSync(
    file, fse.readFileSync(file, "utf8").replace(targetStr, replStr), "utf8"
  );
}

function generateSvelteConfig(options: FullOptionSet): void {
  let svelteConfig = fse.readFileSync(
    DIST_FILES.get("svelteConfig"), "utf8"
  );
  if (options.cssFramework !== "tailwindcss") {
    svelteConfig = svelteConfig.replace(/require\('tailwindcss'\),\s+/, "");
  }
  if (options.plugins?.includes("postcss")
      && options.bundler === "snowpack") {
    svelteConfig = svelteConfig.replace(/\s+require\('cssnano'\),/, "");
  }
  if (!options.plugins?.includes("postcss")) {
    svelteConfig = svelteConfig.replace(
      new RegExp(`${s(4)}postcss.+?${s(4)}},\n`, "s"), ""
    );
  }
  if (/autoPreprocess\({\s*}\)/.test(svelteConfig)) {
    svelteConfig = svelteConfig.replace(
      /autoPreprocess\({\s*}\)/,
      "autoPreprocess()"
    );
  }
  if (options.typescript || options.plugins?.includes("postcss")) {
    fse.writeFileSync("svelte.config.js", svelteConfig);
  }
}

function hasJestConfig(options: FullOptionSet): boolean {
  return (
    REACT_TEMPLATES.includes(options.baseTemplate)
    || (options.baseTemplate === "svelte" && !options.typescript)
  );
}

async function createBase(options: FullOptionSet): Promise<void> {
  const projectDir = styles.cyanBright(path.resolve(options.projectDir));
  console.log(`\n- Creating a new Snowpack app in ${projectDir}`);
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

  fse.copyFileSync(DIST_FILES.get("gitignore"), ".gitignore");

  const targetTemplateDir = DIST_TEMPLATES.get(templateName(options));
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

  if (options.baseTemplate === "svelte") {
    generateSvelteConfig(options);
  } else if (options.baseTemplate === "lit-element") {
    fse.copyFileSync(
      path.join(targetTemplateDir, "babel.config.json"), "babel.config.json"
    );
  }

  if (options.typescript) {
    fse.copySync(path.join(targetTemplateDir, "types"), "types");
    fse.copyFileSync(
      path.join(targetTemplateDir, "tsconfig.json"), "tsconfig.json"
    );
    if (REACT_TEMPLATES.includes(options.baseTemplate)) {
      if (options.testing === "jest") {
        fileReadAndReplace(
          "tsconfig.json",
          "\"mocha\"",
          "\"jest\", \"@testing-library/jest-dom\""
        );
      } else if (!options.testing) {
        fileReadAndReplace("tsconfig.json", "\"mocha\", ", "");
      }
    } else if (options.baseTemplate === "svelte") {
      if (options.testing === "jest" || !options.testing) {
        fileReadAndReplace("tsconfig.json", "\"mocha\", ", "");
      }
    }
  }
  const jsExt = options.typescript ? "ts" : "js";

  if (options.testing === "wtr") {
    fse.copyFileSync(DIST_FILES.get("wtrConfig"), "web-test-runner.config.js");
  } else if (options.testing === "jest" && hasJestConfig(options)) {
    fse.copyFileSync(DIST_FILES.get("jestSetup"), "jest.setup.js");
    fse.copyFileSync(DIST_FILES.get("jestConfig"), "jest.config.js");
    fileReadAndReplace("jest.config.js", "$framework", options.jsFramework);

    if (REACT_TEMPLATES.includes(options.baseTemplate)) {
      fse.copyFileSync(DIST_FILES.get("jestBabel"), "babel.config.json");
      fileReadAndReplace("babel.config.json", "$framework", options.jsFramework);
      fileReadAndReplace(
        `src/App.test.${jsExt}x`,
        "document.body.contains(linkElement))",
        "linkElement).toBeInTheDocument()",
      );
      fileReadAndReplace(
        `src/App.test.${jsExt}x`,
        "import { expect } from 'chai';\n",
        "",
      );
      if (options.baseTemplate === "react-redux") {
        fileReadAndReplace(
          `src/features/counter/counterSlice.test.${jsExt}`,
          /to.eql/g,
          "toEqual",
        );
        fileReadAndReplace(
          `src/features/counter/counterSlice.test.${jsExt}`,
          "import { expect } from 'chai';\n",
          "",
        );
      }
    } else if (options.baseTemplate === "svelte") {
      fileReadAndReplace(
        `src/App.test.${jsExt}`,
        "document.body.contains(linkElement))",
        "linkElement).toBeInTheDocument()",
      );
      fileReadAndReplace(
        `src/App.test.${jsExt}`,
        "import {expect} from 'chai';\n",
        "",
      );
    }
  }

  if (options.codeFormatters?.includes("prettier")) {
    fse.copyFileSync(DIST_FILES.get("prettierConfig"), ".prettierrc");
  }

  if (options.sass) {
    switch (options.baseTemplate) {
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
      case "react-redux":
        fse.renameSync("src/App.css", "src/App.scss");
        fse.renameSync("src/index.css", "src/index.scss");
        fse.renameSync(
          "src/features/counter/Counter.module.css",
          "src/features/counter/Counter.module.scss",
        );
        fileReadAndReplace(`src/App.${jsExt}x`, "App.css", "App.scss");
        fileReadAndReplace(`src/index.${jsExt}x`, "index.css", "index.scss");
        fileReadAndReplace(
          `src/features/counter/Counter.${jsExt}x`,
          "Counter.module.css",
          "Counter.module.scss",
        );
        break;
      default:
        // Vue/Svelte templates have no CSS files
        break;
    }
  }

  if (options.bundler === "snowpack") {
    fse.copyFileSync(
      DIST_FILES.get("resolveProxyImports"),
      "resolveProxyImports-plugin.js",
    );
  }

  if (options.plugins?.includes("postcss")) {
    let postcssConfig = fse.readFileSync(
      DIST_FILES.get("postcssConfig"), "utf8"
    );

    if (options.bundler === "snowpack") {
      postcssConfig = postcssConfig.replace(/.+require\('cssnano'\).+/, "");
    }

    // At least one plugin is required in dev to stop Snowpack from complaining
    if (options.cssFramework === "tailwindcss") {
      postcssConfig = postcssConfig.replace("// : null", ": null");
    } else {
      postcssConfig = postcssConfig.replace(
        /require\('tailwindcss'\),\s+/, ""
      );
      postcssConfig = postcssConfig.replace("// : require", ": require");
    }

    fse.writeFileSync("postcss.config.js", postcssConfig);
  }

  if (options.license) {
    fse.copyFileSync(DIST_FILES.get(options.license), "LICENSE");
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

function generatePackageJson(options: FullOptionSet): void {
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
  if (REACT_TEMPLATES.includes(options.baseTemplate)) {
    jsExts.push("jsx");
  } else if (options.baseTemplate === "vue") {
    jsExts.unshift("vue");
  } else if (options.baseTemplate === "svelte") {
    jsExts.unshift("svelte");
  }
  if (options.typescript) {
    if (options.baseTemplate === "blank") {
      jsExts.unshift("ts");
    } else {
      jsExts.push("ts");
    }
    if (REACT_TEMPLATES.includes(options.baseTemplate)) {
      jsExts.push("tsx");
    } else if (options.baseTemplate === "lit-element") {
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

  const useEslint = options.codeFormatters?.includes("eslint");
  const usePrettier = options.codeFormatters?.includes("prettier");
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

  if (options.baseTemplate === "vue" && options.typescript) {
    appPackageJson.scripts["type-check"] = "tsc";
  }

  if (options.bundler === "webpack" || options.plugins?.includes("postcss")) {
    appPackageJson.browserslist = DEFAULT_BROWSERSLIST;
  }

  // No example tests for Vue/LitElement
  if (options.testing
      && !["vue", "lit-element"].includes(options.baseTemplate)) {
    let jsTestExt = options.typescript ? "ts" : "js";
    if (REACT_TEMPLATES.includes(options.baseTemplate)) {
      jsTestExt = `${jsTestExt}x`;
      if (options.baseTemplate === "react-redux") {
        jsTestExt = `{${jsTestExt},${jsTestExt.slice(0, 2)}}`;
      }
    }
    appPackageJson.scripts.test = (
      options.testing === "wtr"
        ? `web-test-runner \"src/**/*.test.${jsTestExt}\"`
        : "jest src"
    );
  }

  fse.writeFileSync("package.json", JSON.stringify(appPackageJson, null, 2));
}

const PLUGIN_PACKAGES = new Map(Object.entries({
  postcss: [
    "postcss",
    "postcss-preset-env",
    // "cssnano", // Added later conditionally
    "@snowpack/plugin-postcss",
  ],
  srs: ["@snowpack/plugin-run-script"],
  sbs: ["@snowpack/plugin-build-script"],
})) as PluginPackagesMap;

const MAJOR_VERSION_REGEX = /(\d+)\.\d+\.\d+/;
function packageMajorVersion(version: string) {
  return (MAJOR_VERSION_REGEX.exec(version) as RegExpExecArray)[1];
}

function installPackages(options: FullOptionSet): void {
  const prodPackages: string[] = [];
  const devPackages = ["snowpack"];

  const baseTemplate = BASE_TEMPLATES.get(options.baseTemplate);
  prodPackages.push(...baseTemplate.prodPackages);
  devPackages.push(...baseTemplate.devPackages);

  if (options.typescript) {
    devPackages.push(...[
      ...baseTemplate.tsPackages,
      "typescript",
      "@snowpack/plugin-typescript",
      "@types/snowpack-env",
    ]);
    if (options.baseTemplate === "vue") {
      devPackages.pop(); // Remove @types/snowpack-env
      devPackages.pop(); // Remove @snowpack/plugin-typescript
    } else if (options.baseTemplate === "preact") {
      devPackages.pop(); // Remove @types/snowpack-env
    }
  }

  if (options.testing) {
    devPackages.push(...baseTemplate.testPackages);
  }
  if (options.testing === "wtr") {
    devPackages.push(...[
      "@web/test-runner",
      "chai",
      "@snowpack/web-test-runner-plugin",
    ]);
    if (options.typescript) {
      devPackages.push("@types/chai");
      if ([...REACT_TEMPLATES, "svelte"].includes(options.baseTemplate)) {
        devPackages.push("@types/mocha");
      }
    }
  } else if (options.testing === "jest") {
    if (hasJestConfig(options)) {
      // https://github.com/snowpackjs/snowpack/issues/3398
      // Currently (October 9, 2021) restricted by babel-jest dep to v26
      devPackages.push(...[
        "jest@26",
        `@snowpack/app-scripts-${options.jsFramework}@2.0.1`,
      ]);
    } else {
      devPackages.push("jest");
    }
    devPackages.push("@testing-library/jest-dom");
    if (options.typescript) {
      devPackages.push("@types/jest");
    }
  }

  devPackages.push(...(options.codeFormatters ?? []));

  if (options.sass) {
    devPackages.push("@snowpack/plugin-sass");
  }

  if (options.cssFramework) {
    devPackages.push(options.cssFramework);
  }

  if (options.bundler === "webpack") {
    devPackages.push("@snowpack/plugin-webpack");
  }

  for (const plugin of options.plugins ?? []) {
    devPackages.push(...PLUGIN_PACKAGES.get(plugin));
  }
  if (options.plugins?.includes("postcss")) {
    if (options.bundler !== "snowpack") {
      devPackages.push("cssnano");
    }
    if (options.baseTemplate === "svelte"
        && options.cssFramework === "tailwindcss"
        && !devPackages.includes("svelte-preprocess")) {
      devPackages.push("svelte-preprocess");
    }
  }

  prodPackages.push(...(
    options.otherProdDeps?.filter(d => !prodPackages.includes(d)) ?? []
  ));
  devPackages.push(...(
    options.otherDevDeps?.filter(d => !devPackages.includes(d)) ?? []
  ));

  const basePackageJson = require(
    path.join(DIST_TEMPLATES.get(templateName(options)), "package.json")
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
})) as PluginConfigMap;

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

function generateSnowpackConfig(options: FullOptionSet): void {
  let snowpackConfig = fse.readFileSync(
    DIST_FILES.get("snowpackConfig"), "utf8"
  );

  const configPluginsList = [
    ...BASE_TEMPLATES.get(options.baseTemplate).plugins
  ];

  if (options.baseTemplate === "preact") {
    if (options.typescript) {
      configPluginsList.reverse();
    } else {
      snowpackConfig = snowpackConfig.replace(
        /(buildOptions.+},\n)/s, `$1${PREACT_ALIAS}`
      );
    }
  }

  if (options.typescript) {
    if (options.baseTemplate === "vue") {
      configPluginsList.splice(
        1, 0, "'@snowpack/plugin-vue/plugin-tsx-jsx.js'"
      );
    } else {
      configPluginsList.push(TS_PLUGIN_CONFIG);
    }
  }

  if (options.testing === "jest"
      && REACT_TEMPLATES.includes(options.baseTemplate)) {
    if (options.jsFramework === "react") {
      configPluginsList.splice(1, 0, "'@snowpack/plugin-babel'");
    } else if (options.jsFramework === "preact") {
      configPluginsList.unshift("'@snowpack/plugin-babel'");
    }
  }

  if (options.sass) {
    configPluginsList.push("'@snowpack/plugin-sass'");
  }

  if (SNOWPACK_CONFIG_PLUGINS.has(options.bundler)) {
    configPluginsList.push(
      SNOWPACK_CONFIG_PLUGINS.get(options.bundler)
    );
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

  for (const plugin of options.plugins ?? []) {
    if (SNOWPACK_CONFIG_PLUGINS.has(plugin)) {
      configPluginsList.push(SNOWPACK_CONFIG_PLUGINS.get(plugin));
    }
  }

  if (options.bundler === "snowpack") {
    configPluginsList.push("'./resolveProxyImports-plugin.js'");
  }

  if (configPluginsList.length) {
    const configPluginsStr = (
      configPluginsList.map(plugin => `${s(4)}${plugin},\n`).join("")
    );
    snowpackConfig = snowpackConfig.replace(
      /(plugins: \[\n)\s+\/\*.+?\n(\s+\],)/s, `$1${configPluginsStr}$2`
    );
  }

  fse.writeFileSync("snowpack.config.mjs", snowpackConfig);
}

function initializeTailwind(options: FullOptionSet): void {
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

function initializeEslint(options: FullOptionSet): void {
  if (options.codeFormatters?.includes("eslint")) {
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

function initializeGit(options: FullOptionSet): void {
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
function formatCommand(command: string, description: string): string {
  return `${s(2)}${command.padEnd(17)}${description}`;
}

function displayQuickstart(options: FullOptionSet, startDir: string): void {
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

function nodeVersionCheck(): void {
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

async function main(): Promise<void> {
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
    REACT_TEMPLATES,
    s,
    templateName,
    fileReadAndReplace,
    generateSvelteConfig,
    hasJestConfig,
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
