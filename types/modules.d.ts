import type { Chalk } from "chalk";

declare module "styles" {
  const styles: { [key: string]: Chalk };
  export default styles;
}
