const path = require("path");

const execa = require("execa");
const tmp = require("tmp");

const chai = require("chai");
const chaiFiles = require("chai-files");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");

chai.use(sinonChai);
chai.use(chaiFiles);
const { expect } = chai;
const { file } = chaiFiles;

const { SOURCE_PATHS, SOURCE_CONFIGS } = require("../src-templates");

const {
  installPackages,
  generateSvelteConfig,
  generateSnowpackConfig,
} = require("../src/index.ts")._testing;

const {
  newTempBase,
  // testDirectoryContentsEqual,
  newTempPackageJson,
  revertSnowpackConfig,
  parseExecaProdArgs,
  parseExecaDevArgs,
} = require("./test-utils.js");

describe("createBase", () => {
  before(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });
  after(() => {
    console.log.restore();
    console.error.restore();
  });

  it("Generates svelte.config.js for svelte-typescript template", () => {
    const tempDir = tmp.dirSync();
    process.chdir(tempDir.name);
    generateSvelteConfig({
      typescript: true, cssFramework: "", bundler: "", plugins: []
    });
    const generatedSvelteConfig = path.join(tempDir.name, "svelte.config.js");

    const baseSvelteConfig = path.join(
      SOURCE_PATHS.get("svelte-typescript"), "svelte.config.js"
    );
    expect(file(generatedSvelteConfig)).to.equal(file(baseSvelteConfig));
  });
  it("Copies babel.config.json for lit-element template", () => {
    newTempBase(SOURCE_CONFIGS.get("lit-element"));
    const baseBabelConfig = path.join(
      SOURCE_PATHS.get("lit-element"), "babel.config.json"
    );
    expect(file("babel.config.json")).to.equal(file(baseBabelConfig));
  });
  it("Copies babel.config.json for lit-element-typescript template", () => {
    newTempBase(SOURCE_CONFIGS.get("lit-element-typescript"));
    const baseBabelConfig = path.join(
      SOURCE_PATHS.get("lit-element-typescript"), "babel.config.json"
    );
    expect(file("babel.config.json")).to.equal(file(baseBabelConfig));
  });
});

function testPackageJsonScriptsEqual(template) {
  const tempPackageJson = newTempPackageJson(SOURCE_CONFIGS.get(template));
  const basePackageJson = require(
    path.join(SOURCE_PATHS.get(template), "package.json")
  );
  expect(tempPackageJson.scripts).to.eql(basePackageJson.scripts);
}

describe("generatePackageJson", () => {
  it("Generates scripts property for blank template", () => {
    testPackageJsonScriptsEqual("blank");
  });
  it("Generates scripts property for blank-typescript template", () => {
    testPackageJsonScriptsEqual("blank-typescript");
  });
  it("Generates scripts property for react template", () => {
    testPackageJsonScriptsEqual("react");
  });
  it("Generates scripts property for react-typescript template", () => {
    testPackageJsonScriptsEqual("react-typescript");
  });
  it("Generates scripts property for vue template", () => {
    testPackageJsonScriptsEqual("vue");
  });
  it("Generates scripts property for vue-typescript template", () => {
    testPackageJsonScriptsEqual("vue-typescript");
  });
  it("Generates scripts property for svelte template", () => {
    testPackageJsonScriptsEqual("svelte");
  });
  it("Generates scripts property for svelte-typescript template", () => {
    testPackageJsonScriptsEqual("svelte-typescript");
  });
  it("Generates scripts property for preact template", () => {
    testPackageJsonScriptsEqual("preact");
  });
  // it("Generates scripts property for preact-typescript template", () => {
  //   testPackageJsonScriptsEqual("preact-typescript");
  // });
  // Template error, prettier extensions should be TS, not JS
  it("Generates scripts property for lit-element template", () => {
    testPackageJsonScriptsEqual("lit-element");
  });
  it("Generates scripts property for lit-element-typescript template", () => {
    testPackageJsonScriptsEqual("lit-element-typescript");
  });
});

function testPackagesInstalled(template) {
  installPackages(SOURCE_CONFIGS.get(template));
  expect(execa.sync).to.have.been.calledTwice;
  const installedProdPackages = parseExecaProdArgs(execa.sync.args[0][1]);
  const installedDevPackages = parseExecaDevArgs(execa.sync.args[1][1]);
  const basePackageJson = require(
    path.join(SOURCE_PATHS.get(template), "package.json")
  );
  const baseProdPackages = Object.keys(basePackageJson.dependencies);
  const baseDevPackages = Object.keys(basePackageJson.devDependencies);
  installedProdPackages.sort();
  installedDevPackages.sort();
  baseProdPackages.sort();
  baseDevPackages.sort();
  expect(installedProdPackages).to.have.members(baseProdPackages);
  expect(installedDevPackages).to.have.members(baseDevPackages);
}

describe("installPackages", () => {
  before(() => {
    sinon.stub(console, "log");
    sinon.stub(execa, "sync");
  });
  beforeEach(() => {
    execa.sync.resetHistory();
  });
  after(() => {
    console.log.restore();
    execa.sync.restore();
  });

  it("Installs packages for blank template", () => {
    installPackages(SOURCE_CONFIGS.get("blank"));
    expect(execa.sync).to.have.been.calledOnce;
    const installedDevPackages = parseExecaDevArgs(execa.sync.args[0][1]);
    const basePackageJson = require(
      path.join(SOURCE_PATHS.get("blank"), "package.json")
    );
    const baseDevPackages = Object.keys(basePackageJson.devDependencies);
    installedDevPackages.sort();
    baseDevPackages.sort();
    expect(installedDevPackages).to.eql(baseDevPackages);
  });
  it("Installs packages for blank-typescript template", () => {
    installPackages(SOURCE_CONFIGS.get("blank-typescript"));
    expect(execa.sync).to.have.been.calledOnce;
    const installedDevPackages = parseExecaDevArgs(execa.sync.args[0][1]);
    const basePackageJson = require(
      path.join(SOURCE_PATHS.get("blank-typescript"), "package.json")
    );
    delete basePackageJson.devDependencies["@types/canvas-confetti"];
    const baseDevPackages = Object.keys(basePackageJson.devDependencies);
    installedDevPackages.sort();
    baseDevPackages.sort();
    expect(installedDevPackages).to.eql(baseDevPackages);
  });
  it("Installs packages for react template", () => {
    testPackagesInstalled("react");
  });
  it("Installs packages for react-typescript template", () => {
    testPackagesInstalled("react-typescript");
  });
  it("Installs packages for vue template", () => {
    testPackagesInstalled("vue");
  });
  it("Installs packages for vue-typescript template", () => {
    testPackagesInstalled("vue-typescript");
  });
  it("Installs packages for svelte template", () => {
    testPackagesInstalled("svelte");
  });
  it("Installs packages for svelte-typescript template", () => {
    testPackagesInstalled("svelte-typescript");
  });
  it("Installs packages for preact template", () => {
    testPackagesInstalled("preact");
  });
  it("Installs packages for preact-typescript template", () => {
    testPackagesInstalled("preact-typescript");
  });
  it("Installs packages for lit-element template", () => {
    testPackagesInstalled("lit-element");
  });
  it("Installs packages for lit-element-typescript template", () => {
    testPackagesInstalled("lit-element-typescript");
  });
});

function testSnowpackConfigsEqual(template) {
  const tempDir = tmp.dirSync();
  process.chdir(tempDir.name);
  generateSnowpackConfig(SOURCE_CONFIGS.get(template));
  const tempConfigPath = path.join(tempDir.name, "snowpack.config.mjs");
  revertSnowpackConfig(tempConfigPath, "temp.config.js");
  const tempSnowpackConfig = require(
    path.join(tempDir.name, "temp.config.js")
  );

  const baseSnowpackConfigPath = (
    path.join(SOURCE_PATHS.get(template), "snowpack.config.mjs")
  );
  revertSnowpackConfig(baseSnowpackConfigPath, "base.config.js");
  const baseSnowpackConfig = require(
    path.join(tempDir.name, "base.config.js")
  );
  expect(tempSnowpackConfig).to.eql(baseSnowpackConfig);
}

describe("generateSnowpackConfig", () => {
  it("Generates snowpack.config.mjs for blank template", () => {
    testSnowpackConfigsEqual("blank");
  });
  it("Generates snowpack.config.mjs for blank-typescript template", () => {
    testSnowpackConfigsEqual("blank-typescript");
  });
  it("Generates snowpack.config.mjs for react template", () => {
    testSnowpackConfigsEqual("react");
  });
  it("Generates snowpack.config.mjs for react-typescript template", () => {
    testSnowpackConfigsEqual("react-typescript");
  });
  it("Generates snowpack.config.mjs for vue template", () => {
    testSnowpackConfigsEqual("vue");
  });
  it("Generates snowpack.config.mjs for vue-typescript template", () => {
    testSnowpackConfigsEqual("vue-typescript");
  });
  it("Generates snowpack.config.mjs for svelte template", () => {
    testSnowpackConfigsEqual("svelte");
  });
  it("Generates snowpack.config.mjs for svelte-typescript template", () => {
    testSnowpackConfigsEqual("svelte-typescript");
  });
  it("Generates snowpack.config.mjs for preact template", () => {
    testSnowpackConfigsEqual("preact");
  });
  it("Generates snowpack.config.mjs for preact-typescript template", () => {
    testSnowpackConfigsEqual("preact-typescript");
  });
  it("Generates snowpack.config.mjs for lit-element template", () => {
    testSnowpackConfigsEqual("lit-element");
  });
  it("Generates snowpack.config.mjs for lit-element-typescript template", () => {
    testSnowpackConfigsEqual("lit-element-typescript");
  });
});
