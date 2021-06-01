type LockedMap<K, V> = Omit<Map<K, V>, "get" | "set">;

// dist-files and dist-templates
type DistPathMap = LockedMap<string, string> & {
  get(K: string): string;
}

interface PackageJson {
  private: boolean;
  scripts: { [key: string]: string };
  browserslist?: { production: string[], development: string[ ]};
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
}

type PluginPackagesMap = LockedMap<string, string[]> & {
  get(K: string): string[];
};

type PluginConfigMap = LockedMap<string, string> & {
  get(K: string): string;
}
