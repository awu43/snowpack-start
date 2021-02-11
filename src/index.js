/* eslint-disable no-console */

// Node
// const execSync = require('child_process').execSync;
// const childProcess = require("child_process");
const path = require("path");
// const url = require('url');

// Third-party
// const spawn = require('cross-spawn'); // Extra spawn
const execa = require("execa"); // Better child_process
const fse = require("fs-extra"); // Extra file manipulation utils

// Package
const styles = require("./styles.js");
const getOptions = require("./get-options.js");
const JS_FRAMEWORKS = require("./js-frameworks.js");
const BASE_FILES = require("../base-files");
const BASE_TEMPLATE_DIR = require("../base-templates");

function fileReadAndReplace(file, targetStr, replStr) {
  fse.writeFileSync(
    file, fse.readFileSync(file, "utf8").replace(targetStr, replStr), "utf8"
  );
}

async function createBase(options) {
  console.log(`\n- Creating a new Snowpack app in ${styles.cyanBright(options.projectDir)}`);
  try {
    if (fse.pathExistsSync(options.projectDir)) {
      throw Error("Project directory already exists.");
    }
    fse.mkdirSync(options.projectDir, { recursive: true });
  } catch (error) {
    console.error(error);
    console.error(
      styles.fatalError("Error while creating project directory, exiting.")
    );
    process.exit(1);
  }
  process.chdir(options.projectDir);

  fse.copyFileSync(BASE_FILES.get("gitignore"), ".gitignore");
  fse.writeFileSync(
    "README.md", `# ${path.basename(options.projectDir)}\n`, "utf8"
  );

  const targetTemplateDir = path.join(
    BASE_TEMPLATE_DIR,
    `snowpack-${options.jsFramework}${options.typescript ? "-typescript" : ""}`,
  );
  fse.copySync(path.join(targetTemplateDir, "public"), "public");
  fse.copySync(path.join(targetTemplateDir, "src"), "src");
  fse.copyFileSync(BASE_FILES.get("robots.txt"), "public/robots.txt");

  if (options.jsFramework === "react" && !options.typescript) {
    fse.copySync(path.join(targetTemplateDir, ".types"), ".types");
    // What does this folder do??
  }
  if (options.jsFramework === "lit-element") {
    fse.copySync(
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
    fse.writeFileSync(".prettierrc", "{\n  \n}\n", "utf8");
  }

  if (options.sass) {
    switch (options.jsFramework) {
      case "blank":
        fse.moveSync("public/index.css", "src/index.scss");
        fileReadAndReplace("public/index.html", "index.css", "dist/index.css");
        break;
      case "react":
      case "preact":
        fse.renameSync("src/App.css", "src/App.scss");
        fse.renameSync("src/index.css", "src/index.scss");
        break;
      case "vue":
        if (options.typescript) {
          fse.renameSync(
            "src/components/Bar.module.css", "src/components/Bar.module.scss"
          );
          fse.renameSync(
            "src/components/Foo.module.css", "src/components/Foo.module.scss"
          );
        }
        break;
      case "svelte":
        break;
      case "lit-element":
        fse.moveSync("public/index.css", "src/index.scss");
        break;
      default:
        console.error("Invalid framework");
        process.exit(1);
    }
  }

  if ((options.plugins || []).includes("postcss")) {
    console.log(BASE_FILES.get("postcssConfig"));
    fse.copyFileSync(BASE_FILES.get("postcssConfig"), "postcss.config.js");
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

function generatePackageJson(options) {
  const appPackageJson = {
    private: true,
    scripts: {
      start: "snowpack dev",
      build: "snowpack build",
      // eslint-disable-next-line quotes, no-useless-escape
      test: 'echo \"This template does not include a test runner by default.\" && exit 1',
    },
  };

  if (options.bundler === "webpack") {
    appPackageJson.browserslist = ["defaults"];
  }

  // No example tests for Vue/LitElement
  if ((options.plugins || []).includes("wtr")
      && !["vue", "lit-element"].includes(options.jsFramework)) {
    let jsExt = options.typescript ? "ts" : "js";
    if (["react", "preact"].includes(options.jsFramework)) {
      jsExt = `${jsExt}x`;
    }
    // eslint-disable-next-line no-useless-escape
    appPackageJson.scripts.test = `wtr \"src/**/*.test.${jsExt}\"`;
  }

  fse.writeFileSync(
    "package.json", JSON.stringify(appPackageJson, null, 2), "utf8"
  );
}

const PLUGIN_PACKAGES = new Map(Object.entries({
  postcss: [
    "postcss",
    "postcss-cli",
    "postcss-preset-env",
    "cssnano",
    "@snowpack/plugin-postcss",
  ],
  wtr: [
    "@web/test-runner",
    "chai",
    "@snowpack/web-test-runner-plugin",
  ],
  prs: ["@snowpack/plugin-run-script"],
  pbs: ["@snowpack/plugin-build-script"],
  pgo: ["@snowpack/plugin-optimize"],
}));

function installPackages(options) {
  const prodPackages = [];
  const devPackages = [
    "snowpack",
  ];

  const jsFramework = JS_FRAMEWORKS.get(options.jsFramework);
  prodPackages.push(...jsFramework.prodPackages);
  devPackages.push(...jsFramework.devPackages);
  if (options.typescript) {
    devPackages.push(...jsFramework.tsPackages);
  }
  if ((options.plugins || []).includes("wtr")) {
    devPackages.push(...jsFramework.wtrPackages);
  }

  if (options.jsFramework === "react"
      && options.typescript
      && (options.plugins || []).includes("wtr")) {
    devPackages.push("@types/mocha"); // Doesn't appear to do anything??
  }

  if (options.typescript) {
    devPackages.push(...[
      "typescript",
      "@snowpack/plugin-typescript",
      "@types/snowpack-env",
    ]);
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
    devPackages.push(...PLUGIN_PACKAGES.get(plugin));
  }
  console.log(styles.cyanBright("\n- Installing package dependencies. This might take a couple of minutes.\n"));
  if (prodPackages.length) {
    execa.sync("npm i", prodPackages, { stdio: "inherit" });
  }
  execa.sync("npm i -D", devPackages, { stdio: "inherit" });
}

// For spacing in template literals
function s(numSpaces) {
  return " ".repeat(numSpaces);
}

// ['plugin', {}]
function blankPluginConfig(plugin) {
  return `[
${s(6)}'${plugin}',
${s(6)}{
${s(8)}
${s(6)}}
${s(4)}]`;
}

const CONFIG_PLUGIN_NAMES = new Map(Object.entries({
  webpack: "'@snowpack/plugin-webpack'",
  postcss: "'@snowpack/plugin-postcss'",
  prs: "'@snowpack/plugin-run-script'",
  pbs: blankPluginConfig("@snowpack/plugin-build-script"),
  pgo: blankPluginConfig("@snowpack/plugin-optimize"),
}));

const DEFAULT_BUILTIN_BUNDLER_SETTINGS = [
  "bundle: true",
  "treeshake: true",
  "minify: true",
  "target: 'es2017'",
];

function generateSnowpackConfig(options) {
  let snowpackConfig = fse.readFileSync(
    BASE_FILES.get("snowpackConfig"), "utf8"
  );

  const configPluginsList = [...JS_FRAMEWORKS.get(options.jsFramework).plugins];

  if (options.typescript === true) {
    configPluginsList.push("'@snowpack/plugin-typescript'");
  }

  if (options.sass) {
    configPluginsList.push("'@snowpack/plugin-sass'");
  } else {
    snowpackConfig = snowpackConfig.replace(/\s+exclude: \[.+?\],/s, "");
  }

  if (CONFIG_PLUGIN_NAMES.has(options.bundler)) {
    configPluginsList.push(CONFIG_PLUGIN_NAMES.get(options.bundler));
  } else if (options.bundler === "snowpack") {
    const builtinSettings = (
      DEFAULT_BUILTIN_BUNDLER_SETTINGS
        .map(setting => `${s(4)}${setting},\n`).join("")
    );
    snowpackConfig = snowpackConfig.replace(
      /(optimize: {\n)\s+\/\*.+?\n(\s+},)/s, `$1${builtinSettings}$2`
      // /* ... */ -> content
    );
  }

  for (const plugin of options.plugins || []) {
    if (CONFIG_PLUGIN_NAMES.has(plugin)) {
      configPluginsList.push(CONFIG_PLUGIN_NAMES.get(plugin));
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

  fse.writeFileSync("snowpack.config.js", snowpackConfig, "utf8");
}

async function main() {
  const options = await getOptions();
  await createBase(options);
  generatePackageJson(options);
  installPackages(options);
  generateSnowpackConfig(options);

  console.log(styles.cyanBright("\n- Initializing git repo.\n"));
  try {
    execa.sync("git init", { stdio: "inherit" });
    console.log(`\n  - ${styles.successMsg("Success!\n")}`);
  } catch (error) {
    console.error(error);
    console.error(`\n  - ${styles.warningMsg("Something went wrong.\n")}`);
  }

  if ((options.codeFormatters || []).includes("eslint")) {
    try {
      console.log(styles.cyanBright("\n- Initializing ESLint.\n"));
      execa.sync("npx eslint --init", { stdio: "inherit" });
    } catch (error) {
      console.error(error);
      console.error(`\n  - ${styles.warningMsg("Something went wrong.\n")}`);
    }
  }
}

if (require.main === module) {
  main();
}
