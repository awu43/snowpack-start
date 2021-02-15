/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-extraneous-dependencies */
const path = require("path");

const fse = require("fs-extra");
const rewire = require("rewire");
const tmp = require("tmp");

const { expect } = require("chai");

const index = rewire("../src/index.js");
const createBase = index.__get__("createBase");
const generatePackageJson = index.__get__("generatePackageJson");
const generateSnowpackConfig = index.__get__("generateSnowpackConfig");

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
      contents.push(fse.readFileSync(fullPath));
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
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(configPath);
  };
}

const newTempPackageJson = newTempConfigGenerator(
  generatePackageJson, "package.json"
);

const newTempSnowpackConfig = newTempConfigGenerator(
  generateSnowpackConfig, "snowpack.config.js"
);

module.exports = {
  newTempBase,
  testDirectoryContentsEqual,
  newTempPackageJson,
  newTempSnowpackConfig,
};
