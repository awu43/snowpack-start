type DirValidResult = (
  "No directory provided" | "Project directory already exists" | true
);

type ProjectDirPromptKey = "projectDir";
type SelectPromptKey = "jsFramework" | "cssFramework" | "bundler" | "license";
type TogglePromptKey = "typescript" | "sass";
type MultiSelectPromptKey = "codeFormatters" | "plugins";
type ListPromptKey = "otherProdDeps" | "otherDevDeps";
type AuthorPromptKey = "author";
type NonPromptKey = (
  "useYarn" | "usePnpm" | "skipTailwindInit" | "skipEslintInit" | "skipGitInit"
);
type OptionKey = (
  ProjectDirPromptKey
  | SelectPromptKey
  | TogglePromptKey
  | MultiSelectPromptKey
  | ListPromptKey
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
interface ListPrompt extends BasePrompt {
  type: "list";
  initial?: string;
  separator: string;
}
interface AuthorPrompt extends BasePrompt {
  type: (prev: string, values: { license ?: string }) => "text" | null;
  initial?: string;
}
interface NonPrompt {
  type: null;
  message: string;
  initial?: never;
}
type AnyPrompt = (
  ProjectDirPrompt
  | SelectPrompt
  | TogglePrompt
  | MultiSelectPrompt
  | ListPrompt
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
type BooleanOptionPrompt = Extract<AnyPrompt, TogglePrompt | NonPrompt>;
type MultiSelectOptionKey = Extract<OptionKey, MultiSelectPromptKey>;
type MultiSelectOptionPrompt = Extract<AnyPrompt, MultiSelectPrompt>;
type ListOptionKey = Extract<OptionKey, ListPromptKey>;
type ListOptionPrompt = Extract<AnyPrompt, ListPrompt>;

type PromptsMap = LockedMap<OptionKey, AnyPrompt> & {
  // Can't quite figure out how to replace this with keyof
  get(K: ProjectDirPromptKey): ProjectDirPrompt;
  get(K: SelectPromptKey): SelectPrompt;
  get(K: TogglePromptKey): TogglePrompt;
  get(K: MultiSelectPromptKey): MultiSelectPrompt;
  get(K: ListPromptKey): ListPrompt;
  get(K: AuthorPromptKey): AuthorPrompt;
  get(K: NonPromptKey): NonPrompt;

  get(K: StringOptionKey): StringOptionPrompt;
  get(K: BooleanOptionKey): BooleanOptionPrompt;
  get(K: MultiSelectOptionKey): MultiSelectOptionPrompt;
  get(K: ListOptionKey): ListOptionPrompt;

  get(K: OptionKey): AnyPrompt;
};

type OptionTypeString = "string" | "boolean" | "array";
type OptionTypesMap = LockedMap<OptionKey, OptionTypeString> & {
  get(K: OptionKey): OptionTypeString;
};

type OptionTypeCheckFunc = (opt: unknown) => boolean;

type OptionValueType = string | boolean | string[];

type OptionEntries = [OptionKey, OptionValueType][];

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
  otherProdDeps?: string[];
  otherDevDeps?: string[];
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
    Omit<PartialOptionSet, MultiSelectOptionKey| ListPromptKey | NonPromptKey>
  >
> & {
  readonly codeFormatters: readonly string[];
  readonly plugins: readonly string[];
  readonly otherProdDeps: readonly string[]
  readonly otherDevDeps: readonly string[]

  readonly useYarn?: boolean;
  readonly usePnpm?: boolean;
  readonly skipTailwindInit?: boolean;
  readonly skipGitInit?: boolean;
  readonly skipEslintInit?: boolean;
};
