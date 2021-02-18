#!/usr/bin/env node
/* eslint-disable no-useless-escape */
/* eslint-disable no-console */

const path = require("path");

const execa = require("execa"); // Better child_process
const fse = require("fs-extra"); // Extra file manipulation utils

const styles = require("./styles.js");
const { getOptions } = require("./get-options.js");
const JS_FRAMEWORKS = require("./js-frameworks.js");
const BASE_FILES = require("../dist-files");
const BASE_TEMPLATES = require("../dist-templates");

function fileReadAndReplace(file, targetStr, replStr) {
  fse.writeFileSync(
    file, fse.readFileSync(file, "utf8").replace(targetStr, replStr), "utf8"
  );
}

async function createBase(options) {
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

  const targetTemplateDir = BASE_TEMPLATES.get(
    `${options.jsFramework}${options.typescript ? "-typescript" : ""}`,
  );
  let readme = fse.readFileSync(
    path.join(targetTemplateDir, "README.md"), "utf8"
  );
  readme = readme.replace("New Project", path.basename(options.projectDir));
  if (options.useYarn) {
    readme = readme.replace(/npm run/g, "npm").replace(/npm/g, "yarn");
  } else if (options.usePnpm) {
    readme = readme.replace(/npm/g, "pnpm");
  }
  fse.writeFileSync("README.md", readme);

  fse.copySync(path.join(targetTemplateDir, "public"), "public");
  fse.copySync(path.join(targetTemplateDir, "src"), "src");

  // if (options.jsFramework === "react" && !options.typescript) {
  //   fse.copySync(path.join(targetTemplateDir, ".types"), ".types");
  // }
  // What does this folder do??
  if (options.jsFramework === "svelte" && options.typescript) {
    fse.copyFileSync(
      path.join(targetTemplateDir, "svelte.config.js"), "svelte.config.js"
    );
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
        fileReadAndReplace("public/index.html", "index.css", "dist/index.css");
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
      // eslint-disable-next-line quotes
      test: 'echo \"This template does not include a test runner by default.\" && exit 1',
    },
  };

  const jsExts = ["js"];
  if (["react", "preact"].includes(options.jsFramework)) {
    jsExts.push("jsx");
  } else if (options.jsFramework === "vue") {
    jsExts.shift("vue");
  } else if (options.jsFramework === "svelte") {
    jsExts.shift("svelte");
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

  // eslint-disable-next-line quotes
  const eslintFormat = 'eslint --fix \"src/**/*\"';
  // eslint-disable-next-line quotes
  const eslintLint = 'eslint \"src/**/*\"';
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

  if (options.bundler === "webpack") {
    appPackageJson.browserslist = ["defaults"];
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
}));

function installPackages(options) {
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

  if (["react", "svelte"].includes(options.jsFramework)
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
    devPackages.push(...PLUGIN_PACKAGES.get(plugin));
  }

  console.log(styles.cyanBright("\n- Installing package dependencies. This might take a couple of minutes."));
  let cmd;
  if (options.useYarn) {
    cmd = "yarn add";
  } else if (options.usePnpm) {
    cmd = "pnpm add";
  } else {
    cmd = "npm install";
  }
  if (prodPackages.length) {
    execa.sync(cmd, prodPackages, { stdio: "inherit" });
  }
  execa.sync(`${cmd} -D`, devPackages, { stdio: "inherit" });
}

// For spacing in template literals
function s(numSpaces) {
  return " ".repeat(numSpaces);
}

// ['plugin', {}]
// function blankPluginConfig(plugin) {
//   return `[
// ${s(6)}'${plugin}',
// ${s(6)}{
// ${s(8)}
// ${s(6)}}
// ${s(4)}]`;
// }

const prsConfig = `[
${s(6)}'@snowpack/plugin-run-script',
${s(6)}{
${s(8)}cmd: 'echo \"production build command.\"',
${s(8)}watch: 'echo \"dev server command.\"', // (optional)
${s(6)}}
${s(4)}]`;

const pbsConfig = `[
${s(6)}'@snowpack/plugin-build-script',
${s(6)}{
${s(8)}input: [], // files to watch
${s(8)}output: [], // files to export
${s(8)}cmd: 'echo \"build command.\"', // cmd to run
${s(6)}}
${s(4)}]`;

const CONFIG_PLUGIN_NAMES = new Map(Object.entries({
  webpack: "'@snowpack/plugin-webpack'",
  postcss: "'@snowpack/plugin-postcss'",
  prs: prsConfig,
  pbs: pbsConfig,
}));

const DEFAULT_BUILTIN_BUNDLER_SETTINGS = [
  "bundle: true",
  "treeshake: true",
  "minify: true",
  "target: 'es2017'",
];

// For Preact template
const ALIAS = `
${s(2)}alias: {
${s(4)}/* ... */
${s(2)}},
`;

function generateSnowpackConfig(options) {
  let snowpackConfig = fse.readFileSync(
    BASE_FILES.get("snowpackConfig"), "utf8"
  );

  const configPluginsList = [...JS_FRAMEWORKS.get(options.jsFramework).plugins];

  if (options.jsFramework === "preact" && !options.typescript) {
    snowpackConfig = snowpackConfig.replace(
      /(buildOptions.+},\n)/s, `$1${ALIAS}`
    );
  }

  if (options.typescript) {
    if (options.jsFramework === "vue") {
      configPluginsList.splice(
        1, 0, "'@snowpack/plugin-vue/plugin-tsx-jsx.js'"
      );
    } else if (options.jsFramework === "preact") {
      configPluginsList.splice(
        1, 0, "'@snowpack/plugin-typescript'"
      );
    } else {
      configPluginsList.push("'@snowpack/plugin-typescript'");
    }
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

function initializeEslint(options) {
  if ((options.codeFormatters || []).includes("eslint")) {
    if (!options.skipEslintInit) {
      try {
        console.log(styles.cyanBright("\n- Initializing ESLint.\n"));
        const cmd = options.useYarn ? "yarn dlx" : "npx";
        execa.sync(`${cmd} eslint --init`, { stdio: "inherit" });
      } catch (error) {
        console.error(error);
        console.error(`\n  - ${styles.warningMsg("Something went wrong.\n")}`);
      }
    } else {
      console.log(styles.warningMsg("\n- Skipping ESLint init.\n"));
    }
  }
}

function initializeGit(options) {
  if (!options.skipGitInit) {
    console.log(styles.cyanBright("\n- Initializing git repo.\n"));
    try {
      execa.sync("git init", { stdio: "inherit" });
      execa.sync("git add -A", { stdio: "inherit" });
      execa.sync("git commit -m \"Intial commit\"", { stdio: "inherit" });
      console.log(`\n  - ${styles.successMsg("Success!\n")}`);
    } catch (error) {
      console.error(error);
      console.error(`\n  - ${styles.warningMsg("Something went wrong.\n")}`);
    }
  } else {
    console.log(styles.warningMsg("\n- Skipping git init.\n"));
  }
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

// From create-snowpack-app
function formatCommand(command, description) {
  return `${s(2)}${command.padEnd(17)}${description}`;
}

async function main() {
  nodeVersionCheck();

  const startDir = process.cwd();
  const options = await getOptions();
  await createBase(options);
  generatePackageJson(options);
  installPackages(options);
  generateSnowpackConfig(options);

  initializeEslint(options);
  initializeGit(options);

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

if (require.main === module) {
  main();
}

module.exports = {
  _testing: {
    fileReadAndReplace,
    createBase,
    generatePackageJson,
    installPackages,
    s,
    generateSnowpackConfig,
    initializeEslint,
    initializeGit,
    nodeVersionCheck,
  },
};
