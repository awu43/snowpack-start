/* eslint-disable global-require, import/no-dynamic-require */

const path = require("path");

const fse = require("fs-extra");
const JSON5 = require("json5");
const tmp = require("tmp");

const { expect } = require("chai");

const {
  createBase,
  generatePackageJson,
  generateSnowpackConfig,
} = require("../dist/index.js")._testing;

function stripPackageVersions(packages) {
  return packages.map(p => p.replace(/@.?\d+(\.\d+)*/, ""));
}

function newTempBase(options) {
  const tempDir = tmp.dirSync();
  tempDir.removeCallback();
  createBase({ projectDir: tempDir.name, ...options });
  return tempDir;
}

function walkDirContents(targetDir) {
  const contents = [];
  for (const item of fse.readdirSync(targetDir)) {
    const fullPath = path.join(targetDir, item);
    const stat = fse.lstatSync(fullPath);
    if (stat.isFile()) {
      let fileContents;
      switch (path.extname(fullPath)) {
        case ".ico":
          fileContents = fse.readFileSync(fullPath);
          break;
        case ".json":
          fileContents = JSON5.parse(fse.readFileSync(fullPath));
          break;
        default:
          fileContents = fse.readFileSync(fullPath, "utf8");
          break;
      }
      contents.push(fileContents);
    } else if (stat.isDirectory()) {
      contents.push(walkDirContents(fullPath));
    }
  }
  return contents;
}

function testDirectoryContentsEqual(testDir, baseDir) {
  const testContents = walkDirContents(testDir);
  const baseContents = walkDirContents(baseDir);
  expect(testContents).to.eql(baseContents);
}

function newTempConfigGenerator(generateFunc, fileName) {
  return options => {
    const tempDir = tmp.dirSync();
    process.chdir(tempDir.name);
    generateFunc(options);
    const configPath = path.join(tempDir.name, fileName);
    //
    return require(configPath);
  };
}

const newTempPackageJson = newTempConfigGenerator(
  generatePackageJson, "package.json"
);

const newTempSnowpackConfig = newTempConfigGenerator(
  generateSnowpackConfig, "snowpack.config.js"
);

function parseExecaProdArgs(execaArgs) {
  return stripPackageVersions(execaArgs.slice(1));
}

function parseExecaDevArgs(execaArgs) {
  return stripPackageVersions(execaArgs.slice(2));
}

module.exports = {
  stripPackageVersions,
  newTempBase,
  testDirectoryContentsEqual,
  newTempPackageJson,
  newTempSnowpackConfig,
  parseExecaProdArgs,
  parseExecaDevArgs,
};
