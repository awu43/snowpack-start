const chalk = require("chalk"); // Terminal styling

module.exports = {
  cyanBright: chalk.cyanBright,
  whiteBold: chalk.white.bold,
  successMsg: chalk.green,
  warningMsg: chalk.yellow,
  fatalError: chalk.white.bold.bgRed,
  errorMsg: chalk.red,
};
