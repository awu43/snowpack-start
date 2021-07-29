import os = require("os");
import path = require("path");

import commander = require("commander"); // Command line util
import execa = require("execa"); // Better child_process
import fse = require("fs-extra"); // Extra file manipulation utils
import prompts = require("prompts"); // User prompts

import styles = require("./styles");

const PACKAGE_JSON: { name: string, version: string } = require("../package.json");

// eslint-disable-next-line import/newline-after-import
const BUILTIN_DEFAULTS: PartialOptionSet = require("./defaults.js");
const userDefaultsPath = path.join(os.homedir(), ".snowpackstart.js");
const USER_DEFAULTS: PartialOptionSet | null = (
  fse.pathExistsSync(userDefaultsPath) ? require(userDefaultsPath) : null
);
const DEFAULT_OPTIONS = USER_DEFAULTS ?? BUILTIN_DEFAULTS;
const PASSIVE_KEYS: readonly NonPromptKey[] = [
  "useYarn", "usePnpm", "skipTailwindInit", "skipGitInit", "skipEslintInit"
];

function projectDirValidator(projectDir: string): DirValidResult {
  if (!projectDir.trim()) {
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
      { title: "Snowpack Run Script", value: "srs" },
      { title: "Snowpack Build Script", value: "sbs" },
    ],
  },
  otherProdDeps: {
    type: "list",
    name: "otherProdDeps",
    message: "Other prodDeps",
    separator: " ",
  },
  otherDevDeps: {
    type: "list",
    name: "otherDevDeps",
    message: "Other devDeps",
    separator: " ",
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
    type: (prev: string, values: { license ?: string }) => {
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
})) as PromptsMap;

const OPTION_TYPES = new Map(Object.entries({
  projectDir: "string",
  jsFramework: "string",
  typescript: "boolean",
  codeFormatters: "array",
  sass: "boolean",
  cssFramework: "string",
  bundler: "string",
  plugins: "array",
  otherProdDeps: "array",
  otherDevDeps: "array",
  license: "string",
  author: "string",

  useYarn: "boolean",
  usePnpm: "boolean",
  skipTailwindInit: "boolean",
  skipEslintInit: "boolean",
  skipGitInit: "boolean",
})) as OptionTypesMap;

function isString(opt: unknown): opt is string {
  return typeof opt === "string";
}
function isBoolean(opt: unknown): opt is boolean {
  return typeof opt === "boolean";
}
function isArray(opt: unknown): opt is Array<string> {
  return Array.isArray(opt);
}
function optionTypeCheck(optName: OptionKey): OptionTypeCheckFunc {
  switch (OPTION_TYPES.get(optName)) {
    case "string":
      return isString;
    case "boolean":
      return isBoolean;
    case "array":
      return isArray;
    default:
      throw new Error("Invalid option name");
  }
}

class OptionNameError extends Error {
  constructor(optName: string) {
    super(styles.errorMsg(`Unknown option ${styles.cyanBright(optName)}`));
    this.name = "OptionNameError";
  }
}

class OptionTypeError extends Error {
  constructor(optName: OptionKey, optValue: OptionValueType) {
    const expectedType = styles.cyanBright(OPTION_TYPES.get(optName));
    const receivedType = styles.cyanBright(typeof optValue);
    const styledOptName = styles.cyanBright(optName);
    const receivedValue = styles.cyanBright(optValue);
    super(styles.errorMsg(`Expected value of type ${expectedType} for ${styledOptName}, received type ${receivedType} (${receivedValue})`));
    this.name = "OptionTypeError";
  }
}

class OptionValueError extends Error {
  constructor(
    optName: OptionKey,
    optValue: OptionValueType,
    promptChoiceValues: string[],
  ) {
    const receivedValue = styles.cyanBright(optValue);
    const styledOptName = styles.cyanBright(optName);
    const validValues = (
      promptChoiceValues
        .map(c => styles.cyanBright(c))
        .join("/")
    );
    super(styles.errorMsg(`Invalid value ${receivedValue} for ${styledOptName}\nValid values: ${validValues}`));
    this.name = "OptionValueError";
  }
}

// From create-snowpack-app
function packageManagerInstalled(packageManager: PackageManager): boolean {
  try {
    execa.commandSync(`${packageManager} --version`);
    return true;
  } catch (err) {
    return false;
  }
}

function validateOptions(options: PartialOptionSet): void {
  for (const [optName, optValue] of Object.entries(options) as OptionEntries) {
    if (!OPTION_TYPES.has(optName)) {
      throw new OptionNameError(optName);
    }

    if (!optionTypeCheck(optName)(optValue)) {
      throw new OptionTypeError(optName, optValue);
    }

    const promptType = PROMPTS.get(optName).type;
    switch (promptType) {
      case "select":
      case "multiselect": {
        const promptChoiceValues = (
          PROMPTS.get(optName as SelectPromptKey).choices.map(c => c.value)
        );
        const invalidSingleSelect = (
          promptType === "select"
          && !promptChoiceValues.includes(optValue as string)
        );
        const invalidMultiselect = (
          promptType === "multiselect"
          && !(optValue as string[]).every(v => promptChoiceValues.includes(v))
        );
        if (invalidSingleSelect || invalidMultiselect) {
          throw new OptionValueError(optName, optValue, promptChoiceValues);
        }
      }
        break;
      case "list":
        if (!(optValue as unknown[]).every(isString)) {
          throw new Error(
            styles.errorMsg(`${optName} must be an array of strings`)
          );
        }
        break;
      default:
        break;
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

function choicesLine(optName: SelectPromptKey): string {
  return PROMPTS.get(optName).choices
    .map(c => styles.cyanBright(c.value))
    .join("/");
}

function choicesList(optName: MultiSelectPromptKey): string {
  const optMessage = (
    `${PROMPTS.get(optName).message} (<${styles.cyanBright("none")}> for none)`
  );
  const values = (
    PROMPTS.get(optName).choices
      .map(c => `<${styles.cyanBright(c.value)}> (${c.title})`)
      .join("\n")
  );
  return [optMessage, "-".repeat(10), values, "-".repeat(10)].join("\n");
}

function displayDefaults(): void {
  console.log(styles.cyanBright("\n\n  Default options"));

  for (const [optName, optValue] of
      Object.entries(DEFAULT_OPTIONS) as OptionEntries) {
    console.log(`    ${styles.whiteBold(optName)} ${optValue}`);
  }
  console.log("");
}

function getCliOptions(): PartialPreprocessOptionSet {
  console.log(
    styles.snowpackStart(`\n  snowpack-start v${PACKAGE_JSON.version} \n`)
  );

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
    .option(
      "-opd, --other-prod-deps <dependencies...>",
      `Other prod dependencies (<${styles.cyanBright("none")}> to clear preceeding)`
    )
    .option(
      "-odd, --other-dev-deps <dependencies...>",
      `Other dev dependencies (<${styles.cyanBright("none")}> to clear preceeding)`
    )
    .option("-l, --license <license>", `License <${choicesLine("license")}>`)
    .option("-a, --author <author>", "Author\n\n")
    .option("--use-yarn", "Use Yarn")
    .option("--no-use-yarn", "Don't use Yarn")
    .option("--use-pnpm", "Use pnpm")
    .option("--no-use-pnpm", "Don't use pnpm")
    .option("--skip-tailwind-init", "Skip TailwindCSS init")
    .option("--no-skip-tailwind-init", "Don't skip TailwindCSS init")
    .option("--skip-eslint-init", "Skip ESLint init")
    .option("--no-skip-eslint-init", "Don't skip ESLint init")
    .option("--skip-git-init", "Skip git init")
    .option("--no-skip-git-init", "Don't skip git init\n\n")
    .on("-h", displayDefaults)
    .on("--help", displayDefaults)
    .parse(process.argv)
    .opts();

  if (projectDir) {
    cliOptions = { projectDir, ...cliOptions };
  }

  for (const optKey of ["codeFormatters", "plugins"] as const) {
    if (cliOptions[optKey] && cliOptions[optKey].includes("none")) {
      cliOptions[optKey] = [];
    }
  }

  return cliOptions;
}

function loadFiles(cliOptions: { load?: string[] }): PartialOptionSet[] {
  const loadedOptions: PartialOptionSet[] = [];
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
          loadedOptions.push(require(fullPath) as PartialOptionSet);
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

function overwrittenLater(
  optName: OptionKey,
  laterOptions: PartialOptionSet[],
): boolean {
  // Other deps are additive
  if (optName === "otherProdDeps") {
    return laterOptions.some(opts => opts?.otherProdDeps?.includes("none"));
  } else if (optName === "otherDevDeps") {
    return laterOptions.some(opts => opts?.otherDevDeps?.includes("none"));
  } else {
    return laterOptions.some(opts => optName in opts);
  }
}

// Defaults have already been validated when this is called
function applyDefaultsToPrompts(): void {
  for (const [optName, optValue] of
      Object.entries(DEFAULT_OPTIONS) as OptionEntries) {
    if (PASSIVE_KEYS.includes(optName as NonPromptKey)) {
      continue;
    }

    if (typeof optValue === "string") {
      const targetPrompt = PROMPTS.get(optName as StringOptionKey);
      if (targetPrompt.type === "text" || targetPrompt.name === "author") {
        // Project dir, author
        targetPrompt.initial = optValue;
      } else if (targetPrompt.type === "select") {
        // JS framework, CSS framework, bundler, license
        targetPrompt.initial = (
          targetPrompt.choices.findIndex(c => c.value === optValue)
        );
      }
    } else if (typeof optValue === "boolean") {
      // TypeScript, Sass
      PROMPTS.get(optName as BooleanOptionKey).initial = optValue;
    } else if (Array.isArray(optValue)) {
      // Code formatters, plugins, otherProdDeps, otherDevDeps
      switch (optName) {
        case "codeFormatters":
        case "plugins": {
          for (
            const choice of
            PROMPTS.get(optName as MultiSelectOptionKey).choices
          ) {
            if (optValue.includes(choice.value)) {
              choice.selected = true;
            }
          }
          break;
        }
        case "otherProdDeps":
        case "otherDevDeps":
          PROMPTS.get(optName as ListPromptKey).initial = (
            optValue.length ? optValue.join(" ") : ""
          );
          break;
        default:
          break;
      }
    } else {
      console.error(
        styles.fatalError("Error while processing default options")
      );
      throw new OptionTypeError(optName, optValue);
    }
  }
}

function onCancel(): void {
  console.log(styles.fatalError("\nKeyboard exit\n"));
  process.exit(1);
}

function addDeps(deplist: string[], deps: string[]): void {
  for (const dep of deps) {
    if (dep === "none") {
      deplist.splice(0, deplist.length);
    } else if (!deplist.includes(dep)) {
      deplist.push(dep);
    }
  }
}

const otherProdDeps: string[] = [];
const otherDevDeps: string[] = [];

function addOtherProdDeps(
  currentOpts: PartialOptionSet,
  laterOpts: PartialOptionSet[],
): void {
  if (!overwrittenLater("otherProdDeps", laterOpts)) {
    addDeps(otherProdDeps, currentOpts?.otherProdDeps ?? []);
  }
}

function addOtherDevDeps(
  currentOpts: PartialOptionSet,
  laterOpts: PartialOptionSet[],
): void {
  if (!overwrittenLater("otherDevDeps", laterOpts)) {
    addDeps(otherDevDeps, currentOpts?.otherDevDeps ?? []);
  }
}

async function getOptions(): Promise<FullOptionSet> {
  const cliOptions = getCliOptions();
  const loadedOptions = loadFiles(cliOptions);

  const options: PartialOptionSet = {};
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
    const laterOptions = [...loadedOptions, cliOptions];
    for (const [optName, optValue] of
        Object.entries(options) as OptionEntries) {
      const optStatus = (
        overwrittenLater(optName, laterOptions)
          ? styles.errorMsg("×")
          : styles.successMsg("√")
      );
      const optMessage = styles.whiteBold(PROMPTS.get(optName).message);
      console.log(`${optStatus} ${optMessage} ${optValue}`);
    }
    addOtherProdDeps(DEFAULT_OPTIONS, laterOptions);
    addOtherDevDeps(DEFAULT_OPTIONS, laterOptions);
  } else if (USER_DEFAULTS && PASSIVE_KEYS.some(key => key in USER_DEFAULTS)) {
    console.log(styles.cyanBright("\n-- Default options --"));
    const laterOptions = [...loadedOptions, cliOptions];
    for (const optName of PASSIVE_KEYS) {
      if (optName in USER_DEFAULTS) {
        const optValue = USER_DEFAULTS[optName];
        options[optName] = optValue as boolean;
        const optStatus = (
          overwrittenLater(optName, laterOptions)
            ? styles.errorMsg("×")
            : styles.successMsg("√")
        );
        const optMessage = styles.whiteBold(PROMPTS.get(optName).message);
        console.log(`${optStatus} ${optMessage} ${optValue}`);
      }
    }
  }

  if (loadedOptions.length) {
    loadedOptions.forEach((opts, i, arr) => {
      const fileName = path.basename(
        (cliOptions as { load: string[] }).load[i]
      );
      // If options have been loaded then the load field must exist

      try {
        validateOptions(opts);
      } catch (error) {
        console.error(styles.fatalError(`Error while processing ${fileName}`));
        console.error(error.message);
        process.exit(1);
      }

      console.log(styles.cyanBright(`\n-- ${fileName} --`));
      const laterOptions = [...arr.slice(i + 1), cliOptions];
      for (const [optName, optValue] of Object.entries(opts) as OptionEntries) {
        const optStatus = (
          overwrittenLater(optName, laterOptions)
            ? styles.errorMsg("×")
            : styles.successMsg("√")
        );
        const optMessage = styles.whiteBold(PROMPTS.get(optName).message);
        console.log(`${optStatus} ${optMessage} ${optValue}`);
      }
      Object.assign(options, opts);
      addOtherProdDeps(opts, laterOptions);
      addOtherDevDeps(opts, laterOptions);
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
    for (const [optName, optValue] of
        Object.entries(cliOptions) as OptionEntries) {
      const optMessage = styles.whiteBold(`${PROMPTS.get(optName).message}:`);
      console.log(`${styles.successMsg("√")} ${optMessage} ${optValue}`);
    }
    Object.assign(options, cliOptions);
    addOtherProdDeps(cliOptions, []);
    addOtherDevDeps(cliOptions, []);
  }

  const remainingPrompts = (
    [...PROMPTS.keys()]
      .filter(k => PROMPTS.get(k).type !== null) // Doesn't catch author
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

    addOtherProdDeps(options, []);
    addOtherDevDeps(options, []);
  }

  if (options.license === "mit" && !("author" in options)) {
    Object.assign(
      options,
      await prompts(
        { type: "text", name: "author", message: "Author" }, { onCancel }
      )
    );
  }

  options.otherProdDeps = otherProdDeps.filter(Boolean);
  options.otherDevDeps = otherDevDeps.filter(Boolean);
  // Filter empty strings

  if (options.jsFramework === "none") {
    options.jsFramework = "blank";
  }

  for (const optKey of ["cssFramework", "bundler", "license"] as const) {
    if (options[optKey] === "none") {
      (options)[optKey] = "";
    }
  }

  // console.log(options);

  return options as FullOptionSet;
}

export = {
  getOptions,
  _testing: {
    projectDirValidator,
    OptionNameError,
    OptionTypeError,
    OptionValueError,
    validateOptions,
    loadFiles,
    overwrittenLater,
    addDeps,
  },
};
