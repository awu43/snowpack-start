type WriteOnlyMap<K, V> = Omit<Map<K, V>, "get">;

// dist-files and dist-templates
type DistPathMap = WriteOnlyMap<string, string> & {
  get(K: string): string;
}

interface PackageJson {
  private: boolean;
  scripts: { [key: string]: string };
  browserslist?: { production: string[], development: string[ ]};
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
}

type PluginPackagesMap = WriteOnlyMap<string, string[]> & {
  get(K: string): string[];
};

type PluginConfigMap = WriteOnlyMap<string, string> & {
  get(K: string): string;
}
