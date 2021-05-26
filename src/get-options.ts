/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-console */

import os = require("os");
import path = require("path");
import commander = require("commander"); // Command line util
import execa = require("execa"); // Better child_process
import fse = require("fs-extra"); // Extra file manipulation utils
import prompts = require("prompts"); // User prompts

const styles = require("./styles.ts");
const PACKAGE_JSON = require("../package.json");

const userDefaultsPath = path.join(os.homedir(), ".snowpackstart.js");
const DEFAULT_OPTIONS = (
  fse.pathExistsSync(userDefaultsPath)
    ? require(userDefaultsPath)
    : require("./defaults.ts")
);

function projectDirValidator(projectDir: string) {
  if (!projectDir.trim().length) {
    return "No directory provided";
  } else if (fse.pathExistsSync(projectDir)) {
    return "Project directory already exists";
  } else {
    return true;
  }
}

interface BasePrompt {
  type: string | null;
  name: string;
}
interface Choice {
  title: string;
  value: string;
  selected?: boolean;
}
interface SelectPrompt {
  type: "select" | "multiselect";
  name: string;
  message: string;
  choices: Choice[];
}
interface TogglePrompt {
  type: "toggle";
  name: string;
  active: string;
  inactive: string;
  initial?: boolean;
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
      { title: "Snowpack Run Script", value: "srs" },
      { title: "Snowpack Build Script", value: "sbs" },
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
    type: (prev: string, values: object) => {
      if (prev === "mit" && "license" in values) {
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
  skipTailwindInit: {
    type: null,
    message: "Skip TailwindCSS init",
  },
  skipEslintInit: {
    type: null,
    message: "Skip ESLint init",
  },
  skipGitInit: {
    type: null,
    message: "Skip git init",
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
  skipTailwindInit: "boolean",
  skipEslintInit: "boolean",
  skipGitInit: "boolean",
}));

function isString(opt: any) {
  return typeof opt === "string";
}
function isBoolean(opt: any) {
  return typeof opt === "boolean";
}
function isArray(opt: any) {
  return Array.isArray(opt);
}
const OPTION_TYPE_CHECKS = new Map(Object.entries({
  projectDir: isString,
  jsFramework: isString,
  typescript: isBoolean,
  codeFormatters: isArray,
  sass: isBoolean,
  cssFramework: isString,
  bundler: isString,
  plugins: isArray,
  license: isString,
  author: isString,

  useYarn: isBoolean,
  usePnpm: isBoolean,
  skipTailwindInit: isBoolean,
  skipGitInit: isBoolean,
  skipEslintInit: isBoolean,
}));

class OptionNameError extends Error {
  constructor(optName: string) {
    super(styles.errorMsg(`Unknown option ${styles.cyanBright(optName)}`));
    this.name = "OptionNameError";
  }
}

class OptionTypeError extends Error {
  constructor(optName: string, optValue: any) {
    super(styles.errorMsg(`Expected value of type ${styles.cyanBright(OPTION_TYPES.get(optName))} for ${styles.cyanBright(optName)}, received type ${styles.cyanBright(typeof optValue)} (${styles.cyanBright(optValue)})`));
    this.name = "OptionTypeError";
  }
}

class OptionValueError extends Error {
  constructor(optName: string, optValue: any, promptChoices: string[]) {
    super(styles.errorMsg(`Invalid value ${styles.cyanBright(optValue)} for ${styles.cyanBright(optName)}\nValid values: ${promptChoices.map(c => styles.cyanBright(c)).join("/")}`));
    this.name = "OptionValueError";
  }
}

// From create-snowpack-app
function packageManagerInstalled(packageManager: string) {
  try {
    execa.commandSync(`${packageManager} --version`);
    return true;
  } catch (err) {
    return false;
  }
}

interface OptionSet {
  projectDir?: string,
  jsFramework?: string,
  typescript?: boolean,
  codeFormatters?: string[],
  sass?: boolean,
  cssFramework?: string,
  bundler?: string,
  plugins?: string[],
  license?: string,
  author?: string,

  useYarn?: boolean,
  usePnpm?: boolean,
  skipTailwindInit?: boolean,
  skipGitInit?: boolean,
  skipEslintInit?: boolean,
}
function validateOptions(options: OptionSet) {
  for (const [optName, optValue] of Object.entries(options)) {
    if (!OPTION_TYPES.has(optName)) {
      throw new OptionNameError(optName);
    }
    if (!OPTION_TYPE_CHECKS.get(optName)!(optValue)) {
      throw new OptionTypeError(optName, optValue);
    }
    const promptType = PROMPTS.get(optName)!.type;
    if (["select", "multiselect"].includes(promptType as string)) {
      const promptChoices = (
        (PROMPTS.get(optName) as SelectPrompt).choices.map(c => c.value)
      );
      const invalidSingleSelect = (
        promptType === "select" && !promptChoices.includes(optValue)
      );
      const invalidMultiselect = (
        promptType === "multiselect"
        && !optValue.every((v: string) => promptChoices.includes(v))
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

function choicesLine(optName: string) {
  return (PROMPTS.get(optName) as SelectPrompt).choices
    .map(c => styles.cyanBright(c.value))
    .join("/");
}

function choicesList(optName: string) {
  const optMessage = `${(PROMPTS.get(optName) as SelectPrompt).message} (<${styles.cyanBright("none")}> for none)`;
  const values = (PROMPTS.get(optName) as SelectPrompt).choices
    .map(c => `<${styles.cyanBright(c.value)}> (${c.title})`).join("\n");
  return [optMessage, "-".repeat(10), values, "-".repeat(10)].join("\n");
}

function displayDefaults() {
  console.log(styles.cyanBright("\n  Default options"));

  for (const [optName, optValue] of Object.entries(DEFAULT_OPTIONS)) {
    console.log(`    ${styles.whiteBold(optName)} ${optValue}`);
  }
  console.log("");
}

interface CliOptionSet extends OptionSet {
  defaults?: boolean;
  load?: string[];
}
function getCliOptions() {
  let projectDir;
  let cliOptions = new commander.Command(PACKAGE_JSON.name)
    .version(PACKAGE_JSON.version)
    .arguments("[project-dir]") // No prefix required
    .usage(`${styles.cyanBright("[project-directory]")} [other options]`)
    .action((pd: string) => { projectDir = pd; })
    .description("Start a new custom Snowpack app.")
    .option("-d, --defaults", "Use default options")
    .option("--load <files...>", "Load options from files")
    .option(
      "-jsf, --js-framework <framework>",
      `JavaScript framework <${choicesLine("jsFramework")}>`,
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
      `CSS framework\n<${choicesLine("cssFramework")}>`,
    )
    .option("-b, --bundler <bundler>", `Bundler <${choicesLine("bundler")}>`)
    .option("-p, --plugins <plugins...>", choicesList("plugins"))
    .option("-l, --license <license>", `License <${choicesLine("license")}>`)
    .option("-a, --author <author>", "Author")
    .option("--use-yarn", "Use Yarn")
    .option("--use-pnpm", "Use pnpm")
    .option("--skip-tailwind-init", "Skip TailwindCSS init")
    .option("--skip-eslint-init", "Skip ESLint init")
    .option("--skip-git-init", "Skip git init")
    .on("-h", displayDefaults)
    .on("--help", displayDefaults)
    .parse(process.argv)
    .opts();

  if (projectDir) {
    cliOptions = { projectDir, ...cliOptions };
  }

  for (const optKey of ["codeFormatters", "plugins"]) {
    if (cliOptions[optKey] && cliOptions[optKey].includes("none")) {
      cliOptions[optKey] = [];
    }
  }

  return cliOptions;
}

function loadFiles(cliOptions: CliOptionSet) {
  const loadedOptions = [];
  if (cliOptions.load) {
    for (const file of cliOptions.load) {
      const fullPath = path.resolve(file);
      try {
        if (!fse.pathExistsSync(file)) {
          throw new Error(styles.fatalError("File does not exist"));
        } else if (path.extname(fullPath) !== ".js") {
          throw new Error(
            styles.fatalError(`Invalid file type ${path.extname(fullPath)}, expected .js`)
          );
        } else {
          loadedOptions.push(require(fullPath));
        }
      } catch (error) {
        console.error(error.message);
        console.error(
          styles.errorMsg(`Could not load ${fullPath}`)
        );
        process.exit(1);
      }
    }
  }

  return loadedOptions;
}

function overwrittenLater(optName: string, laterOptions: OptionSet[]) {
  return laterOptions.some(opts => optName in opts);
}

function applyDefaultsToPrompts() {
  for (const [optName, optValue] of Object.entries(DEFAULT_OPTIONS)) {
    if (typeof optValue === "string") {
      const targetPrompt = PROMPTS.get(optName) as any;
      if (targetPrompt.type === "text" || targetPrompt.name === "author") {
        // Project dir, author
        targetPrompt.initial = optValue;
      } else if (targetPrompt.type === "select") {
        // JS framework, CSS framework, bundler, license
        targetPrompt.initial = (
          targetPrompt.choices.findIndex((c: Choice) => c.value === optValue)
        );
      }
    } else if (typeof optValue === "boolean") { // TypeScript, Sass
      (PROMPTS.get(optName) as TogglePrompt).initial = optValue;
    } else if (Array.isArray(optValue)) { // Code formatters, plugins
      for (const choice of (PROMPTS.get(optName) as SelectPrompt).choices) {
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

async function getOptions() {
  const cliOptions = getCliOptions();
  const loadedOptions = loadFiles(cliOptions);

  const options: {[key: string]: boolean | string | string[] | null } = {};
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
      let optMessage = styles.whiteBold(PROMPTS.get(optName)!.message);
      if (overwrittenLater(optName, [cliOptions, ...loadedOptions])) {
        optMessage = `${styles.errorMsg("×")} ${optMessage}`;
      } else {
        optMessage = `${styles.successMsg("√")} ${optMessage}`;
      }
      console.log(`${optMessage} ${optValue}`);
    }
  }

  if (loadedOptions.length) {
    loadedOptions.forEach((opts, i, arr) => {
      const fileName = path.basename(cliOptions.load[i]);
      try {
        validateOptions(opts);
      } catch (error) {
        console.error(styles.fatalError(`Error while processing ${fileName}`));
        console.error(error.message);
        process.exit(1);
      }

      console.log(styles.cyanBright(`\n-- ${fileName} --`));
      for (const [optName, optValue] of Object.entries(opts)) {
        let optMessage = styles.whiteBold(
          (PROMPTS.get(optName) as SelectPrompt).message
        );
        if (overwrittenLater(optName, [cliOptions, ...arr.slice(i + 1)])) {
          optMessage = `${styles.errorMsg("×")} ${optMessage}`;
        } else {
          optMessage = `${styles.successMsg("√")} ${optMessage}`;
        }
        console.log(`${optMessage} ${optValue}`);
      }
      Object.assign(options, opts);
    });
    delete cliOptions.load;
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
      const optMessage = styles.whiteBold(
        `${PROMPTS.get(optName)!.message}: `
      );
      console.log(`${styles.successMsg("√")} ${optMessage}${optValue}`);
    }
    Object.assign(options, cliOptions);
  }

  const remainingPrompts = (
    [...PROMPTS.keys()]
      .filter(k => (PROMPTS.get(k) as BasePrompt).type !== null) // Doesn't catch author
      .filter(k => !(k in options))
      .map(k => PROMPTS.get(k))
  );
  const uselessAuthorPrompt = (
    remainingPrompts.length === 1
    && remainingPrompts[0] === PROMPTS.get("author")
    && options.license !== "mit"
  );
  // The author prompt only shows if the previous prompt was for a license
  // and the choice selected was MIT
  // If a license has already been selected and MIT was not the choice,
  // author is not required
  if (remainingPrompts.length && !uselessAuthorPrompt) {
    applyDefaultsToPrompts();
    if (Object.keys(options).length) {
      console.log(styles.cyanBright("\n-- Remaining options --"));
    } else {
      console.log(styles.cyanBright("\n-- Options --"));
    }
    Object.assign(
      options,
      await prompts(remainingPrompts as prompts.PromptObject[], { onCancel })
    );
  }

  if (options.license === "mit" && !("author" in options)) {
    Object.assign(
      options,
      await prompts(
        { type: "text", name: "author", message: "Author" }, { onCancel }
      )
    );
  }

  if (options.jsFramework === "none") {
    options.jsFramework = "blank";
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
    loadFiles,
    overwrittenLater,
  },
};
