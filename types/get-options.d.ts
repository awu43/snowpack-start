type DirValidResult = (
  "No directory provided" | "Project directory already exists" | true
);

type WriteOnlyMap<K, V> = Omit<Map<K, V>, "get">;

type SelectPromptKey = "jsFramework" | "cssFramework" | "bundler" | "license";

type MultiSelectPromptKey = "codeFormatters" | "plugins";

type NonPromptKey = (
  "useYarn" | "usePnpm" | "skipTailwindInit" | "skipEslintInit" | "skipGitInit"
);

interface BasePrompt {
  name: string;
  message: string;
}

interface ProjectDirPrompt extends BasePrompt {
  type: "text";
  validate: (projectDir: string) => DirValidResult;
}

interface Choice {
  title: string;
  value: string;
  selected?: boolean;
}

interface SelectPrompt extends BasePrompt {
  type: "select";
  choices: Choice[];
}

interface TogglePrompt extends BasePrompt {
  type: "toggle";
  active: string;
  inactive: string;
  initial?: boolean;
}

interface MultiSelectPrompt extends BasePrompt {
  type: "multiselect";
  choices: Choice[];
}

interface AuthorPrompt extends BasePrompt {
  type: (prev: string, values: { license ?: string }) => "text" | null;
}

interface NonPrompt {
  type: null;
  message: string;
}

type PromptsMap = WriteOnlyMap & {
  get(K: "projectDir"): ProjectDirPrompt;
  get(K: SelectPromptKey): SelectPrompt;
  get(K: "typescript" | "sass"): TogglePrompt;
  get(K: MultiSelectPromptKey): MultiSelectPrompt;
  get(K: "author"): AuthorPrompt;
  get(K: NonPromptKey): NonPrompt;
}

// type StringOptKey = (
//   "projectDir"
//   | "jsFramework"
//   | "cssFramework"
//   | "bundler"
//   | "license"
//   | "author"
// );

// type BooleanOptKey = "typescript" | "sass" | NonPromptKey;

// type ArrayOptKey = "codeFormatters" | "plugins";

type OptionKey = (
  "projectDir"
  | "jsFramework"
  | "typescript"
  | "codeFormatters"
  | "sass"
  | "cssFramework"
  | "bundler"
  | "plugins"
  | "license"
  | "author"

  | "useYarn"
  | "usePnpm"
  | "skipTailwindInit"
  | "skipEslintInit"
  | "skipGitInit"
);

type OptionTypesMap = WriteOnlyMap & {
  get(K: OptionKey): "string" | "boolean" | "array"
}

type OptionTypeChecksMap = WriteOnlyMap & {
  get(K: OptionKey): boolean;
}

type OptionValueType = string | boolean | string[];

type PackageManager = "npm" | "yarn" | "pnpm";

interface PartialOptionSet {
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

// Before defaults are applied and files loaded
interface PartialPreprocessOptionSet extends PartialOptionSet {
  defaults?: boolean;
  load?: string[];
}

type NullableOptionKey = "cssFramework" | "bundler" | "license";

type NonNullOptionSet = Required<Omit<PartialOptionSet, NullableOptionKey>>;

type NullableOptionSet = Record<NullableOptionKey, string | null>;

type FullOptionSet = NonNullOptionSet & NullableOptionSet;
