import type { Chalk } from "chalk";

declare module "styles" {
  const styles: { [key: string]: Chalk };
  export default styles;
}

declare module "get-options" {
  const _getOptions: {
    getOptions: () => Promise<FullOptionSet>;
    _testing: unknown; // Don't care for main program
  };
  export default _getOptions;
}
