type WriteOnlyMap<K, V> = Omit<Map<K, V>, "get">;

type DistPathMap = WriteOnlyMap<string, string> & {
  get(K: string): string;
}
