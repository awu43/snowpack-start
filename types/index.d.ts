type LockedMap<K, V> = Omit<Map<K, V>, "get" | "set">;

// js-frameworks
interface JsFrameworkData {
  readonly prodPackages: readonly string[];
  readonly devPackages: readonly string[];
  readonly tsPackages: readonly string[];
  readonly wtrPackages: readonly string[];
  readonly plugins: readonly string[];
}

type JsFrameworkMap = LockedMap<string, JsFrameworkData> & {
  get(K: string): JsFrameworkData;
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
