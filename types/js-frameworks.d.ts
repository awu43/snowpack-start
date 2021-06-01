interface JsFrameworkData {
  prodPackages: string[];
  devPackages: string[];
  tsPackages: string[];
  wtrPackages: string[];
  plugins: string[];
}

type JsFrameworkMap = LockedMap<string, JsFrameworkData> & {
  get(K: string): JsFrameworkData;
};
