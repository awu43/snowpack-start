type LockedMap<K, V> = Omit<Map<K, V>, "get" | "set">;

// js-frameworks
interface BaseTemplateData {
  readonly prodPackages: readonly string[];
  readonly devPackages: readonly string[];
  readonly tsPackages: readonly string[];
  readonly wtrPackages: readonly string[];
  readonly plugins: readonly string[];
}

type BaseTemplateMap = LockedMap<string, BaseTemplateData> & {
  get(K: string): BaseTemplateData;
};

// dist-files and dist-templates
type DistPathMap = LockedMap<string, string> & {
  get(K: string): string;
}

// index
interface PackageJson {
  private: boolean;
  scripts: { [key: string]: string };
  browserslist?: { production: string[]; development: string[] };
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
}

type PluginPackagesMap = LockedMap<string, string[]> & {
  get(K: string): readonly string[];
};

type PluginConfigMap = LockedMap<string, string> & {
  get(K: string): string;
}
