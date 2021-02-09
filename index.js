/* eslint-disable guard-for-in */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

// Node
// const execSync = require('child_process').execSync;
// const childProcess = require("child_process");
const os = require("os");
const path = require("path");
// const url = require('url');

// Third-party
const chalk = require("chalk"); // Terminal styling
const commander = require("commander"); // Command line util
// const spawn = require('cross-spawn'); // Extra spawn
const execa = require("execa"); // Better child_process
const fse = require("fs-extra"); // Extra file manipulation utils
const prompts = require("prompts"); // User prompts
const tmp = require("tmp"); // Temporary files/dirs

// Package
const PACKAGE_JSON = require("./package.json");
const BASE_FILES = require("./base-files");
const BASE_TEMPLATE_DIR = require("./base-templates");

const userDefaults = path.join(os.homedir(), ".snowpackstart.js");
const DEFAULT_OPTIONS = (
  fse.pathExistsSync(userDefaults)
  // eslint-disable-next-line import/no-dynamic-require
    ? require(userDefaults)
    : require("./defaults.js")
);

function projectDirValidator(projectDir) {
  if (!projectDir.trim().length) {
    return "No directory provided";
  } else if (fse.pathExistsSync(projectDir)) {
    return "Project directory already exists";
  } else {
    return true;
  }
}
// const JS_FRAMEWORK_CHOICES = [
//   { title: "None", value: "none" },
//   { title: "React", value: "react" },
//   { title: "Vue", value: "vue" },
//   { title: "Svelte", value: "svelte" },
//   { title: "Preact", value: "preact" },
//   { title: "LitElement", value: "lit-element" },
// ];
// const CODE_FORMATTER_CHOICES = [
//   { title: "ESLint", value: "eslint", selected: true },
//   { title: "Prettier", value: "prettier" },
// ];
// const CSS_FRAMEWORK_CHOICES = [
//   { title: "None", value: "none" },
//   { title: "Tailwind CSS", value: "tailwind" },
//   { title: "Bootstrap", value: "bootstrap" },
// ];
// const BUNDLER_CHOICES = [
//   { title: "Webpack", value: "webpack" },
//   // { title: "Rollup", value: "rollup" }, // No working example
//   { title: "Snowpack", value: "snowpack" },
//   { title: "None", value: "none" },
// ];
// const SNOWPACK_PLUGIN_CHOICES = [
//   { title: "PostCSS", value: "postcss", selected: true },
//   { title: "Web Test Runner", value: "wtr", selected: true },
//   { title: "Plugin Run Script", value: "prs" },
//   { title: "Plugin Build Script", value: "pbs" },
//   { title: "Plugin Optimize", value: "pgo" },
// ];
// const LICENSE_CHOICES = [
//   { title: "MIT", value: "mit" },
//   { title: "GPL", value: "gpl" },
//   { title: "Apache", value: "apache" },
//   { title: "None", value: "none" },
// ];

// const JS_FRAMEWORK_CHOICES = [
//   "None",
//   "React",
//   "Vue",
//   "Svelte",
//   "Preact",
//   "LitElement",
// ];
// const BUNDLER_CHOICES = [
//   "Webpack",
//   "Rollup",
//   "Snowpack",
//   "None",
// ];
// const LICENSE_CHOICES = [
//   "MIT",
//   "GPL",
//   "Apache",
//   "None",
// ];

const PROMPTS = new Map(Object.entries({
  projectDir: {
    type: "text",
    name: "projectDir",
    message: "Project directory",
    validate: projectDirValidator,
  },
  jsFramework: {
    type: "select",
    name: "jsFramework",
    message: "JavaScript framework",
    choices: [
      { title: "None", value: "none" },
      { title: "React", value: "react" },
      { title: "Vue", value: "vue" },
      { title: "Svelte", value: "svelte" },
      { title: "Preact", value: "preact" },
      { title: "LitElement", value: "lit-element" },
    ],
  },
  typescript: {
    type: "toggle",
    name: "typescript",
    message: "TypeScript",
    active: "Yes",
    inactive: "No",
  },
  codeFormatters: {
    type: "multiselect",
    name: "codeFormatters",
    message: "Code formatters",
    choices: [
      { title: "ESLint", value: "eslint" },
      { title: "Prettier", value: "prettier" },
    ],
  },
  sass: {
    type: "toggle",
    name: "sass",
    message: "Sass",
    active: "Yes",
    inactive: "No",
  },
  cssFramework: {
    type: "select",
    name: "cssFramework",
    message: "CSS framework",
    choices: [
      { title: "None", value: "none" },
      { title: "Tailwind CSS", value: "tailwind" },
      { title: "Bootstrap", value: "bootstrap" },
    ],
  },
  bundler: {
    type: "select",
    name: "bundler",
    message: "Bundler",
    choices: [
      { title: "Webpack", value: "webpack" },
      // { title: "Rollup", value: "rollup" }, // No working example
      { title: "Snowpack", value: "snowpack" },
      { title: "None", value: "none" },
    ],
  },
  plugins: {
    type: "multiselect",
    name: "plugins",
    message: "Other plugins",
    choices: [
      { title: "PostCSS", value: "postcss" },
      { title: "Web Test Runner", value: "wtr" },
      { title: "Plugin Run Script", value: "prs" },
      { title: "Plugin Build Script", value: "pbs" },
      { title: "Plugin Optimize", value: "pgo" },
    ],
  },
  license: {
    type: "select",
    name: "license",
    message: "License",
    choices: [
      { title: "MIT", value: "mit" },
      { title: "GPL", value: "gpl" },
      { title: "Apache", value: "apache" },
      { title: "None", value: "none" },
    ],
  },
  author: {
    type: (prev, values) => {
      if (prev === "mit" && "license" in values) {
        return "text";
      } else {
        return null;
      }
    },
    name: "author",
    message: "Author",
  },
}));

function displayDefaults() {
  console.log(chalk.cyanBright("\n  Default settings"));
  for (const optName in DEFAULT_OPTIONS) {
    console.log(`    ${`${chalk.white.bold(optName)}`} ${
      DEFAULT_OPTIONS[optName]}`);
  }
  console.log("");
}

function applyDefaultsToPrompts() {
  for (const optName in DEFAULT_OPTIONS) {
    const optValue = DEFAULT_OPTIONS[optName];
    if (typeof optValue === "string") {
      const targetPrompt = PROMPTS.get(optName);
      if (targetPrompt.type === "text" || targetPrompt.name === "author") {
        // Project dir, author
        targetPrompt.initial = optValue;
      } else if (targetPrompt.type === "select") {
        // JS framework, CSS framework, bundler, license
        targetPrompt.initial = (
          targetPrompt.choices.findIndex(c => c.value === optValue)
        );
      }
    } else if (typeof optValue === "boolean") { // TypeScript, Sass
      PROMPTS.get(optName).initial = optValue;
    } else if (Array.isArray(optValue)) { // Code formatters, plugins
      for (const choice of PROMPTS.get(optName).choices) {
        if (optValue.includes(choice.value)) {
          choice.selected = true;
        }
      }
    }
  }
}

function onCancel(prompt) {
  console.log(chalk.white.bold.bgRed("\nKeyboard exit\n"));
  process.exit(1);
}

async function getOptions() {
  let projectDir;
  let cliOptions = new commander.Command(PACKAGE_JSON.name)
    .version(PACKAGE_JSON.version)
    .arguments("[project-dir]") // No prefix required
    .usage(`${chalk.green("[project-directory]")} [other options]`)
    .action(pd => { projectDir = pd; })
    .description("Start a new custom Snowpack app.")
    .option("-d, --defaults", "Use default settings")
    .option(
      "-jsf, --js-framework <framework>",
      [
        "JavaScript framework <",
        PROMPTS.get("jsFramework").choices
          .map(framework => framework.value).join("/"),
        ">",
      ].join("")
    )
    .option(
      "-cdf, --code-formatters <formatters...>",
      [
        "Code formatters",
        "-".repeat(10),
        PROMPTS.get("codeFormatters").choices
          .map(cf => `<${cf.value}> (${cf.title})`).join("\n"),
        "-".repeat(10),
      ].join("\n")
    )
    .option("-ts, --typescript", "Use TypeScript")
    .option("-nts, --no-typescript", "Don't use TypeScript")
    .option("-s, --sass", "Use Sass")
    .option("-ns, --no-sass", "Don't use Sass")
    .option(
      "-cssf, --css-framework <framework>",
      `CSS Framework <${PROMPTS.get("cssFramework").choices
        .map(cf => cf.value).join("/")}>`,
    )
    .option(
      "-b, --bundler <bundler>",
      `Bundler <${PROMPTS.get("bundler").choices
        .map(bundler => bundler.value).join("/")}>`,
    )
    .option(
      "-p, --plugins <plugins...>",
      [
        "Other plugins",
        "-".repeat(10),
        PROMPTS.get("plugins").choices
          .map(p => `<${p.value}> (${p.title})`).join("\n"),
        "-".repeat(10),
      ].join("\n")
    )
    .option(
      "-l, -license <license>",
      `License <${PROMPTS.get("license").choices
        .map(license => license.value).join("/")}>`,
    )
    .option("-a, --author <author>", "Author")
    .on("-h", displayDefaults)
    .on("--help", displayDefaults)
    .parse(process.argv)
    .opts();

  if (projectDir) {
    cliOptions = { projectDir, ...cliOptions };
  }

  // console.log(cliOptions);

  const options = {};
  if (cliOptions.defaults) {
    Object.assign(options, JSON.parse(JSON.stringify(DEFAULT_OPTIONS)));
    // Quick and dirty deep copy
    delete cliOptions.defaults;

    console.log(chalk.cyanBright("\n-- Default options --"));
    for (const optName in options) {
      let optMessage = chalk.white.bold(PROMPTS.get(optName).message);
      if (optName in cliOptions) {
        optMessage = `${chalk.red("×")} ${optMessage}`;
      } else {
        optMessage = `${chalk.green("√")} ${optMessage}`;
      }
      console.log(`${optMessage} ${options[optName]}`);
    }
  }

  if (Object.keys(cliOptions).length) {
    console.log(chalk.cyanBright("\n-- CLI options --"));
    for (const optName in cliOptions) {
      const optMessage = chalk.white.bold(`${PROMPTS.get(optName).message}: `);
      console.log(`${chalk.green("√")} ${optMessage}${cliOptions[optName]}`);
    }
    Object.assign(options, cliOptions);
  }

  const remainingPrompts = (
    [...PROMPTS.keys()].filter(k => !(k in options)).map(k => PROMPTS.get(k))
  );
  if (remainingPrompts.length) {
    applyDefaultsToPrompts();
    if (Object.keys(options).length) {
      console.log(chalk.cyanBright("\n-- Remaining options --"));
    } else {
      console.log(chalk.cyanBright("\n-- Options --"));
    }
    Object.assign(options, await prompts(remainingPrompts, { onCancel }));
  }

  if (options.jsFramework === "none") {
    options.jsFramework = "blank";
  }

  if (options.license === "mit" && !("author" in options)) {
    options.author = await prompts({
      type: "text",
      name: "author",
      message: "Author",
    }, { onCancel }).author;
  }

  // console.log(options);

  return options;
}

function fileReadAndReplace(file, targetStr, replStr) {
  fse.writeFileSync(
    file, fse.readFileSync(file).replace(targetStr, replStr)
  );
}

async function createBase(options) {
  console.log(`\n- Creating a new Snowpack app in ${chalk.cyanBright(options.projectDir)}`);
  try {
    if (fse.pathExistsSync(options.projectDir)) {
      throw Error("Project directory already exists");
    }
    fse.mkdirSync(options.projectDir, { recursive: true });
  } catch (error) {
    console.error(error);
    console.error(`${chalk.white.bold.bgRed("Error while creating project directory, exiting.")}`);
    process.exit(1);
  }
  process.chdir(options.projectDir);

  fse.copyFileSync(BASE_FILES.get("robots.txt"), "robots.txt");
  fse.copyFileSync(BASE_FILES.get("gitignore"), ".gitignore");
  fse.writeFileSync("README.md", `# ${path.basename(options.projectDir)}\n`);

  const targetTemplateDir = path.join(
    BASE_TEMPLATE_DIR,
    `snowpack-${options.jsFramework}${options.typescript ? "-typescript" : ""}`,
  );
  fse.copySync(path.join(targetTemplateDir, "public"), "public");
  fse.copySync(path.join(targetTemplateDir, "src"), "src");

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
    fse.copySync(
      path.join(targetTemplateDir, "tsconfig.json"), "tsconfig.json"
    );
  }

  if (options.codeFormatters.includes("prettier")) {
    fse.writeFileSync(".prettierrc", "{\n  \n}\n");
  }

  if (options.sass) {
    const jsExt = options.typescript ? "ts" : "js";
    switch (options.jsFramework) {
      case "blank":
        fse.moveSync("public/index.css", "src/index.scss");
        break;
      case "react":
      case "preact":
        fse.renameSync("src/App.css", "src/App.scss");
        fse.renameSync("src/index.css", "src/index.scss");
        fileReadAndReplace(`src/App.${jsExt}x`, "App.css", "App.scss");
        fileReadAndReplace(`src/index.${jsExt}x`, "index.css", "index.scss");
        break;
      case "vue":
        break;
      case "svelte":
        break;
      // case "preact":
      //   fse.renameSync("src/App.css", "src/App.scss");
      //   fse.renameSync("src/index.css", "src/index.scss");
      //   fileReadAndReplace(`src/App.${jsExt}x`, "App.css", "App.scss");
      //   fileReadAndReplace(`src/index.${jsExt}x`, "index.css", "index.scss");
      //   break;
      case "lit-element":
        fse.moveSync("public/index.css", "src/index.scss");
        break;
      default:
        console.error("Invalid framework");
        process.exit(1);
    }
  }

  if (options.plugins.includes("postcss")) {
    fse.copyFileSync(BASE_FILES.get("postcssConfig"), "postcss.config.js");
  }
  if (options.plugins.includes("wtr")) {
    fse.copyFileSync(BASE_FILES.get("wtrConfig"), "web-test-runner.config.js");
  }
  if (options.license) {
    fse.copyFileSync(BASE_FILES.get(options.license), "LICENSE");
    if (options.license === "mit") {
      const author = await prompts(
        { type: "text", name: "author", message: "Author" }, { onCancel }
      ).author;
      fileReadAndReplace(
        "LICENSE", "YYYY Author", `${new Date().getFullYear()} ${author}`
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
      test: "echo \"This template does not include a test runner by default.\" && exit 1",
    },
  };

  if (options.bundler === "webpack") {
    appPackageJson.browserslist = ["defaults"];
  }

  // No example tests for Vue/LitElement
  if (options.plugins.includes("wtr") && options.jsFramework !== "vue"
      && options.jsFramework !== "lit-element") {
    let jsExt = options.typescript ? "ts" : "js";
    if (options.framework === "react" || options.framework === "preact") {
      jsExt = `${jsExt}x`;
    }
    appPackageJson.scripts.test = `wtr \\"src/**/*.test.${jsExt}\\"`;
  }

  fse.writeFileSync("package.json", JSON.stringify(appPackageJson, null, 2));
}

const JS_FRAMEWORK_PROD_PACKAGES = new Map(Object.entries({
  blank: [],
  react: ["react", "react-dom"],
  vue: ["vue"],
  svelte: ["svelte"],
  preact: ["preact"],
  "lit-element": ["lit-element", "lit-html"],
}));
const JS_FRAMEWORK_DEV_PACKAGES = new Map(Object.entries({
  blank: [],
  react: [
    "@snowpack/plugin-react-refresh",
    "@snowpack/plugin-dotenv",
  ],
  vue: [
    "@snowpack/plugin-vue",
    "@snowpack/plugin-dotenv",
  ],
  svelte: [
    "@snowpack/plugin-svelte",
    "@snowpack/plugin-dotenv",
  ],
  preact: [
    "@prefresh/snowpack",
    "@snowpack/plugin-dotenv",
  ],
  "lit-element": [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-decorators",
    "@snowpack/plugin-babel",
    "@snowpack/plugin-dotenv",
  ],
}));

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

  prodPackages.push(...JS_FRAMEWORK_PROD_PACKAGES.get(options.jsFramework));
  devPackages.push(...JS_FRAMEWORK_DEV_PACKAGES.get(options.jsFramework));
  switch (options.jsFramework) {
    case "blank":
      break;
    case "react":
      if (options.typescript) {
        devPackages.push(...[
          "@types/react",
          "@types/react-dom",
        ]);
        if (options.plugins.includes("wtr")) {
          devPackages.push("@types/mocha"); // Doesn't appear to do anything??
        }
      }
      if (options.plugins.includes("wtr")) {
        devPackages.push("@testing-library/react");
      }
      break;
    case "vue":
      if (options.plugins.includes("wtr")) {
        devPackages.push("@testing-library/vue");
      }
      break;
    case "svelte":
      if (options.typescript) {
        devPackages.push("svelte-preprocess");
      }
      if (options.plugins.includes("wtr")) {
        devPackages.push("@testing-library/svelte");
      }
      break;
    case "preact":
      if (options.plugins.includes("wtr")) {
        devPackages.push("@testing-library/preact");
      }
      break;
    case "lit-element":
      if (options.typescript) {
        devPackages.push("@babel/preset-typescript");
      }
      break;
    default:
      console.error("Invalid framework");
      process.exit(1);
  }

  if (options.typescript) {
    devPackages.push(...[
      "typescript",
      "@snowpack/plugin-typescript",
      "@types/snowpack-env",
    ]);
    if (options.plugins.includes("wtr")) {
      devPackages.push(...[
        "@types/chai",
      ]);
    }
  }

  if (options.codeFormatters.includes("eslint")) {
    devPackages.push("ESLint");
  } else if (options.codeFormatters.includes("prettier")) {
    devPackages.push("Prettier");
  }

  if (options.sass) {
    devPackages.push("@snowpack/plugin-sass");
  }

  if (options.cssFramework === "tailwind") {
    devPackages.push("tailwindcss");
  } else if (options.cssFramework === "bootstrap") {
    devPackages.push("bootstrap");
  }

  if (options.bundler === "webpack") {
    devPackages.push("@snowpack/plugin-webpack");
  }
  // else if (options.bundler === "Rollup") {
  //   devPackages.push("snowpack-plugin-rollup-bundle");
  // }

  devPackages.push(...options.plugins.map(p => PLUGIN_PACKAGES.get(p)));
  // for (const plugin of options.plugins) {
  //   devPackages.push(...PLUGIN_PACKAGES.get(plugin));
  // }
  console.log(chalk.cyanBright("\n- Installing package dependencies. This might take a couple of minutes.\n"));
  if (prodPackages.length) {
    execa.commandSync(`npm i ${prodPackages.join(" ")}`, { shell: true });
  }
  execa.commandSync(`npm i -D ${devPackages.join(" ")}`, { shell: true });
}

const JS_FRAMEWORK_PLUGINS = new Map(Object.entries({
  blank: [],
  react: [
    "@snowpack/plugin-react-refresh",
    "@snowpack/plugin-dotenv",
  ],
  vue: [
    "@snowpack/plugin-vue",
    "@snowpack/plugin-dotenv",
  ],
  svelte: [
    "@snowpack/plugin-svelte",
    "@snowpack/plugin-dotenv",
  ],
  preact: [
    "@prefresh/snowpack",
    "@snowpack/plugin-dotenv"
  ],
  "lit-element": [
    "@snowpack/plugin-babel",
    "@snowpack/plugin-dotenv",
  ],
}));

// For spacing in template literals
function s(numSpaces) {
  return " ".repeat(numSpaces);
}

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
  // rollup: "snowpack-plugin-rollup-bundle",
  postcss: "'@snowpack/plugin-postcss'",
  prs: "'@snowpack/plugin-run-script'",
  pbs: blankPluginConfig("@snowpack/plugin-build-script"),
  pgo: blankPluginConfig("@snowpack/plugin-optimize"),
}));

const DEFAULT_BUILTIN_BUNDLER_SETTINGS = [
  "bundle: true",
  "treeshake: true",
  "minify: true",
  "target: \"es2017\"",
];

function generateSnowpackConfig(options) {
  let snowpackConfig = fse.readFileSync(BASE_FILES.get("snowpackConfig"));

  const configPluginsList = JS_FRAMEWORK_PLUGINS.get(options.jsFramework);

  if (options.typescript) {
    configPluginsList.push("@snowpack/plugin-typescript");
  }

  if (options.sass) {
    configPluginsList.push("@snowpack/plugin-sass");
  } else {
    snowpackConfig = snowpackConfig.replace(/\s+exclude: \[.+?\],/s, "");
  }

  if (CONFIG_PLUGIN_NAMES.includes(options.bundler)) {
    configPluginsList.push(CONFIG_PLUGIN_NAMES.get(options.bundler));
  } else if (options.bundler === "snowpack") {
    // let builtinSettings = "";
    // for (const defaultLine of DEFAULT_BUILTIN_BUNDLER_SETTINGS) {
    //   builtinSettings = `${builtinSettings}    ${defaultLine},\n`; // 4 spaces
    // }
    const builtinSettings = (
      DEFAULT_BUILTIN_BUNDLER_SETTINGS
        .map(setting => `${s(4)}${setting},\n`).join("")
    );
    snowpackConfig = snowpackConfig.replace(
      /(optimize: {\n)\s+\/\*.+?\n(\s+},)/s, `$1${builtinSettings}$2`
      // /* ... */ -> content
    );
  }

  for (const plugin of options.plugins) {
    if (CONFIG_PLUGIN_NAMES.includes(plugin)) {
      configPluginsList.push(CONFIG_PLUGIN_NAMES.get(plugin));
    }
  }

  if (configPluginsList.length) {
    // let pluginStr = "";
    // for (const plugin of configPlugins) {
    //   pluginStr = `${pluginStr}    ${plugin},\n`; // 4 spaces
    // }
    const configPluginsStr = (
      configPluginsList.map(plugin => `${s(4)}${plugin},\n`).join("")
    );
    snowpackConfig = snowpackConfig.replace(
      /(plugins: \[\n)\s+\/\*.+?\n(\s+\],)/s, `$1${configPluginsStr}$2`
    );
  }

  fse.writeFileSync("snowpack.config.js", snowpackConfig);
}

async function main() {
  const options = await getOptions();
  // await createBase(options);
  // generatePackageJson(options);
  // installPackages(options);
  // generateSnowpackConfig(options);

  // console.log(chalk.cyanBright("\n- Initializing git repo.\n"));
  // try {
  //   execa.commandSync("git init", { shell: true });
  //   console.log(`  - ${chalk.green("Success!")}`);
  // } catch (error) {
  //   console.error(error);
  //   console.error(`  - ${chalk.yellow("Something went wrong.")}`);
  // }

  // if (options.codeFormatter.includes("eslint")) {
  //   try {
  //     console.log(chalk.cyanBright("\n- Initializing ESLint.\n"));
  //     execa.commandSync("npx eslint --init", { shell: true });
  //   } catch (error) {
  //     console.error(error);
  //     console.error(`  - ${chalk.yellow("Something went wrong.")}`);
  //   }
  // }
}
main();
