import chalk = require("chalk"); // Terminal styling

export = {
  snowpackStart: chalk.white.bold.bgCyan,
  cyanBright: chalk.cyanBright,
  whiteBold: chalk.white.bold,
  successMsg: chalk.green,
  warningMsg: chalk.yellow,
  fatalError: chalk.white.bold.bgRed,
  errorMsg: chalk.red,
  boldUl: chalk.bold.underline,
};
