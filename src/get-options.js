/* eslint-disable no-prototype-builtins */
/* eslint-disable no-console */

const os = require("os");
const path = require("path");
const commander = require("commander"); // Command line util
const execa = require("execa");
const fse = require("fs-extra"); // Extra file manipulation utils
const prompts = require("prompts"); // User prompts

const styles = require("./styles.js");
const PACKAGE_JSON = require("../package.json");

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
      { title: "Tailwind CSS", value: "tailwindcss" },
      { title: "Bootstrap", value: "bootstrap" },
    ],
  },
  bundler: {
    type: "select",
    name: "bundler",
    message: "Bundler",
    choices: [
      { title: "Webpack", value: "webpack" },
      { title: "Snowpack", value: "snowpack" },
      { title: "None", value: "none" },
    ],
  },
  plugins: {
    type: "multiselect",
    name: "plugins",
    message: "Other plugins",
    choices: [
      { title: "Web Test Runner", value: "wtr" },
      { title: "PostCSS", value: "postcss" },
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
      if (prev === "mit" && values.hasOwnProperty("license")) {
        return "text";
      } else {
        return null;
      }
    },
    name: "author",
    message: "Author",
  },
  // CLI only below
  useYarn: {
    type: null,
    message: "Use Yarn",
  },
  usePnpm: {
    type: null,
    message: "Use pnpm",
  },
  skipGitInit: {
    type: null,
    message: "Skip git init",
  },
  skipEslintInit: {
    type: null,
    message: "Skip ESLint init",
  },
}));

const OPTION_TYPES = new Map(Object.entries({
  projectDir: "string",
  jsFramework: "string",
  typescript: "boolean",
  codeFormatters: "array",
  sass: "boolean",
  cssFramework: "string",
  bundler: "string",
  plugins: "array",
  license: "string",
  author: "string",

  useYarn: "boolean",
  usePnpm: "boolean",
  skipGitInit: "boolean",
  skipEslintInit: "boolean",
}));

const OPTION_TYPE_CHECKS = new Map(Object.entries({
  projectDir: opt => typeof opt === "string",
  jsFramework: opt => typeof opt === "string",
  typescript: opt => typeof opt === "boolean",
  codeFormatters: opt => Array.isArray(opt),
  sass: opt => typeof opt === "boolean",
  cssFramework: opt => typeof opt === "string",
  bundler: opt => typeof opt === "string",
  plugins: opt => Array.isArray(opt),
  license: opt => typeof opt === "string",
  author: opt => typeof opt === "string",

  useYarn: opt => typeof opt === "boolean",
  usePnpm: opt => typeof opt === "boolean",
  skipGitInit: opt => typeof opt === "boolean",
  skipEslintInit: opt => typeof opt === "boolean",
}));

class OptionNameError extends Error {
  constructor(optName) {
    super(styles.errorMsg(`Unknown option ${styles.cyanBright(optName)}`));
    this.name = "OptionNameError";
  }
}

class OptionTypeError extends Error {
  constructor(optName, optValue) {
    super(styles.errorMsg(`Expected value of type ${styles.cyanBright(OPTION_TYPES.get(optName))} for ${styles.cyanBright(optName)}, received ${styles.cyanBright(typeof optValue)}`));
    this.name = "OptionTypeError";
  }
}

class OptionValueError extends Error {
  constructor(optName, optValue, promptChoices) {
    super(styles.errorMsg(`Invalid value ${styles.cyanBright(optValue)} for ${styles.cyanBright(optName)}\nValid values: ${promptChoices.map(c => styles.cyanBright(c)).join("/")}`));
    this.name = "OptionValueError";
  }
}

// From create-snowpack-app
function packageManagerInstalled(packageManager) {
  try {
    execa.commandSync(`${packageManager} --version`);
    return true;
  } catch (err) {
    return false;
  }
}

function validateOptions(options) {
  for (const [optName, optValue] of Object.entries(options)) {
    if (!OPTION_TYPES.has(optName)) {
      throw new OptionNameError(optName);
    }
    if (!OPTION_TYPE_CHECKS.get(optName)(optValue)) {
      throw new OptionTypeError(optName, optValue);
    }
    const promptType = PROMPTS.get(optName).type;
    if (["select", "multiselect"].includes(promptType)) {
      const promptChoices = PROMPTS.get(optName).choices.map(c => c.value);
      const invalidSingleSelect = (
        promptType === "select" && !promptChoices.includes(optValue)
      );
      const invalidMultiselect = (
        promptType === "multiselect"
        && !optValue.every(v => promptChoices.includes(v))
      );
      if (invalidSingleSelect || invalidMultiselect) {
        throw new OptionValueError(optName, optValue, promptChoices);
      }
    }
    if (options.useYarn && options.usePnpm) {
      throw new Error(
        styles.errorMsg("You can't use Yarn and pnpm at the same time")
      );
    } else if (options.useYarn && !packageManagerInstalled("yarn")) {
      throw new Error(
        styles.errorMsg("Yarn doesn't seem to be installed")
      );
    } else if (options.usePnpm && !packageManagerInstalled("pnpm")) {
      throw new Error(
        styles.errorMsg("pnpm doesn't seem to be installed")
      );
    }
  }
}

function displayDefaults() {
  console.log(styles.cyanBright("\n  Default settings"));

  for (const [optName, optValue] of Object.entries(DEFAULT_OPTIONS)) {
    console.log(`    ${styles.whiteBold(optName)} ${optValue}`);
  }
  console.log("");
}

function applyDefaultsToPrompts() {
  for (const [optName, optValue] of Object.entries(DEFAULT_OPTIONS)) {
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
    } else {
      console.error(
        styles.fatalError("Error while processing default options")
      );
      throw new OptionTypeError(optName, optValue);
    }
  }
}

function onCancel() {
  console.log(styles.fatalError("\nKeyboard exit\n"));
  process.exit(1);
}

function choicesLine(optName) {
  return PROMPTS.get(optName).choices
    .map(c => styles.cyanBright(c.value))
    .join("/");
}

function choicesList(optName) {
  const optMessage = PROMPTS.get(optName).message;
  const values = PROMPTS.get(optName).choices
    .map(c => `<${styles.cyanBright(c.value)}> (${c.title})`).join("\n");
  return [optMessage, "-".repeat(10), values, "-".repeat(10)].join("\n");
}

async function getOptions() {
  let projectDir;
  let cliOptions = new commander.Command(PACKAGE_JSON.name)
    .version(PACKAGE_JSON.version)
    .arguments("[project-dir]") // No prefix required
    .usage(`${styles.cyanBright("[project-directory]")} [other options]`)
    .action(pd => { projectDir = pd; })
    .description("Start a new custom Snowpack app.")
    .option("-d, --defaults", "Use default options")
    .option(
      "-jsf, --js-framework <framework>",
      `JavaScript Framework <${choicesLine("jsFramework")}>`,
    )
    .option(
      "-cdf, --code-formatters <formatters...>", choicesList("codeFormatters")
    )
    .option("-ts, --typescript", "Use TypeScript")
    .option("-nts, --no-typescript", "Don't use TypeScript")
    .option("-s, --sass", "Use Sass")
    .option("-ns, --no-sass", "Don't use Sass")
    .option(
      "-cssf, --css-framework <framework>",
      `CSS Framework\n<${choicesLine("cssFramework")}>`,
    )
    .option("-b, --bundler <bundler>", `Bundler <${choicesLine("bundler")}>`)
    .option("-p, --plugins <plugins...>", choicesList("plugins"))
    .option("-l, -license <license>", `License <${choicesLine("license")}>`)
    .option("-a, --author <author>", "Author")
    .option("--use-yarn", "Use Yarn")
    .option("--use-pnpm", "Use Pnpm")
    .option("--skip-eslint-init", "Skip ESLint init")
    .option("--skip-git-init", "Skip git init")
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
    try {
      validateOptions(DEFAULT_OPTIONS);
    } catch (error) {
      console.error(
        styles.fatalError("Error while processing default options")
      );
      console.error(error.message);
      process.exit(1);
    }

    Object.assign(options, JSON.parse(JSON.stringify(DEFAULT_OPTIONS)));
    // Quick and dirty deep copy
    delete cliOptions.defaults;

    console.log(styles.cyanBright("\n-- Default options --"));
    for (const [optName, optValue] of Object.entries(options)) {
      let optMessage = styles.whiteBold(PROMPTS.get(optName).message);
      if (cliOptions.hasOwnProperty(optName)) {
        optMessage = `${styles.errorMsg("×")} ${optMessage}`;
      } else {
        optMessage = `${styles.successMsg("√")} ${optMessage}`;
      }
      console.log(`${optMessage} ${optValue}`);
    }
  }

  if (Object.keys(cliOptions).length) {
    console.log(styles.cyanBright("\n-- CLI options --"));
    try {
      validateOptions(cliOptions);
    } catch (error) {
      console.error(
        styles.fatalError("Error while processing CLI options")
      );
      console.error(error.message);
      process.exit(1);
    }
    for (const [optName, optValue] of Object.entries(cliOptions)) {
      const optMessage = styles.whiteBold(`${PROMPTS.get(optName).message}: `);
      console.log(`${styles.successMsg("√")} ${optMessage}${optValue}`);
    }
    Object.assign(options, cliOptions);
  }

  const remainingPrompts = (
    [...PROMPTS.keys()]
      .filter(k => k.type !== null)
      .filter(k => !options.hasOwnProperty(k))
      .map(k => PROMPTS.get(k))
  );
  if (remainingPrompts.length) {
    applyDefaultsToPrompts();
    if (Object.keys(options).length) {
      console.log(styles.cyanBright("\n-- Remaining options --"));
    } else {
      console.log(styles.cyanBright("\n-- Options --"));
    }
    Object.assign(options, await prompts(remainingPrompts, { onCancel }));
  }

  if (options.license === "mit" && !options.hasOwnProperty("author")) {
    Object.assign(
      options,
      await prompts(
        { type: "text", name: "author", message: "Author" }, { onCancel }
      )
    );
  }

  for (const optKey of ["cssFramework", "bundler", "license"]) {
    if (options[optKey] === "none") {
      options[optKey] = null;
    }
  }

  // console.log(options);

  return options;
}

module.exports = {
  getOptions,
  _testing: {
    projectDirValidator,
    OptionNameError,
    OptionTypeError,
    OptionValueError,
    validateOptions,
  },
};
