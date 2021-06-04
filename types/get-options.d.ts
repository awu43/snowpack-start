type DirValidResult = (
  "No directory provided" | "Project directory already exists" | true
);

type ProjectDirPromptKey = "projectDir";
type SelectPromptKey = "jsFramework" | "cssFramework" | "bundler" | "license";
type TogglePromptKey = "typescript" | "sass";
type MultiSelectPromptKey = "codeFormatters" | "plugins";
type AuthorPromptKey = "author";
type NonPromptKey = (
  "useYarn" | "usePnpm" | "skipTailwindInit" | "skipEslintInit" | "skipGitInit"
);
type OptionKey = (
  ProjectDirPromptKey
  | SelectPromptKey
  | TogglePromptKey
  | MultiSelectPromptKey
  | AuthorPromptKey
  | NonPromptKey
);

interface BasePrompt {
  name: string;
  message: string;
}
interface ProjectDirPrompt extends BasePrompt {
  type: "text";
  validate: (projectDir: string) => DirValidResult;
  initial?: string;
}
interface Choice {
  title: string;
  value: string;
  selected?: boolean;
}
interface SelectPrompt extends BasePrompt {
  type: "select";
  choices: Choice[];
  initial?: number;
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
  initial?: string;
}
interface NonPrompt {
  type: null;
  message: string;
}
type AnyPrompt = (
  ProjectDirPrompt
  | SelectPrompt
  | TogglePrompt
  | MultiSelectPrompt
  | AuthorPrompt
  | NonPrompt
);

// interface PromptRecord {
//   ProjectDirPromptKey: ProjectDirPrompt;
//   SelectPromptKey: SelectPrompt;
//   TogglePromptKey: TogglePrompt;
//   MultiSelectPromptKey: MultiSelectPrompt;
//   AuthorPromptKey: AuthorPrompt;
//   NonPromptKey: NonPrompt;
// }

type StringOptionKey = Extract<
  OptionKey,
  ProjectDirPromptKey | SelectPromptKey | AuthorPromptKey
>;
type StringOptionPrompt = Extract<
  AnyPrompt, ProjectDirPrompt | SelectPrompt | AuthorPrompt
>;
type BooleanOptionKey = Extract<OptionKey, TogglePromptKey | NonPromptKey>;
type BooleanOptionPrompt = Extract<
  OptionPrompt,
  TogglePromptPrompt | NonPromptPrompt
>;
type ArrayOptionKey = Extract<OptionKey, MultiSelectPromptKey>;
type ArrayOptionPrompt = Extract<OptionPrompt, MultiSelectPromptPrompt>;

type PromptsMap = LockedMap<OptionKey, AnyPrompt> & {
  // Can't quite figure out how to replace this with keyof
  get(K: ProjectDirPromptKey): ProjectDirPrompt;
  get(K: SelectPromptKey): SelectPrompt;
  get(K: TogglePromptKey): TogglePrompt;
  get(K: MultiSelectPromptKey): MultiSelectPrompt;
  get(K: AuthorPromptKey): AuthorPrompt;
  get(K: NonPromptKey): NonPrompt;

  get(K: StringOptionKey): StringOptionPrompt;
  get(K: BooleanOptionKey): BooleanOptionPrompt;
  get(K: ArrayOptionKey): ArrayOptionPrompt;

  get(K: OptionKey): AnyPrompt;
};

type OptionTypeString = "string" | "boolean" | "array";
type OptionTypesMap = LockedMap<OptionKey, OptionTypeString> & {
  get(K: OptionKey): OptionTypeString;
};

type OptionTypeCheckFunc = (opt: unknown) => boolean;
type OptionTypeCheckMap = LockedMap<OptionKey, OptionTypeCheckFunc> & {
  get(K: OptionKey): OptionTypeCheckFunc;
}

type OptionValueType = string | boolean | string[];

type PackageManager = "npm" | "yarn" | "pnpm";

interface PartialOptionSet {
  projectDir?: string;
  jsFramework?: string;
  typescript?: boolean;
  codeFormatters?: string[];
  sass?: boolean;
  cssFramework?: string;
  bundler?: string;
  plugins?: string[];
  license?: string;
  author?: string;

  useYarn?: boolean;
  usePnpm?: boolean;
  skipTailwindInit?: boolean;
  skipGitInit?: boolean;
  skipEslintInit?: boolean;
}

// Before defaults are applied and files loaded
interface PartialPreprocessOptionSet extends PartialOptionSet {
  defaults?: boolean;
  load?: string[];
}

type FullOptionSet = Readonly<
  Required<
    Omit<PartialOptionSet, ArrayOptionKey | NonPromptKey>
  >
> & {
  readonly codeFormatters: readonly string[];
  readonly plugins: readonly string[];

  readonly useYarn?: boolean;
  readonly usePnpm?: boolean;
  readonly skipTailwindInit?: boolean;
  readonly skipGitInit?: boolean;
  readonly skipEslintInit?: boolean;
};
