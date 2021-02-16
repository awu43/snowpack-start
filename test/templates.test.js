/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-console */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const path = require("path");

const execa = require("execa");

const chai = require("chai");
const chaiFiles = require("chai-files");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");

chai.use(sinonChai);
chai.use(chaiFiles);
const { expect } = chai;
const { file } = chaiFiles;

const SOURCE_TEMPLATES = require("../src-templates");

const { installPackages } = require("../src/index.js")._testing;

const {
  newTempBase,
  testDirectoryContentsEqual,
  newTempPackageJson,
  newTempSnowpackConfig,
} = require("./test-utils.js");

const TEMPLATE_CONFIGS = new Map(Object.entries({
  none: {
    jsFramework: "none",
    typescript: false,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  "none-typescript": {
    jsFramework: "none",
    typescript: true,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  react: {
    jsFramework: "react",
    typescript: false,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  "react-typescript": {
    jsFramework: "react",
    typescript: true,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  vue: {
    jsFramework: "vue",
    typescript: false,
    codeFormatters: [],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  "vue-typescript": {
    jsFramework: "vue",
    typescript: true,
    codeFormatters: [],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  svelte: {
    jsFramework: "svelte",
    typescript: false,
    codeFormatters: [],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  "svelte-typescript": {
    jsFramework: "svelte",
    typescript: true,
    codeFormatters: [],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  preact: {
    jsFramework: "preact",
    typescript: false,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  "preact-typescript": {
    jsFramework: "preact",
    typescript: true,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: ["wtr"],
    license: "mit",
  },
  "lit-element": {
    jsFramework: "lit-element",
    typescript: false,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
  "lit-element-typescript": {
    jsFramework: "lit-element",
    typescript: true,
    codeFormatters: ["prettier"],
    sass: false,
    cssFramework: null,
    bundler: null,
    plugins: [],
    license: "mit",
  },
}));

describe("createBase", () => {
  before(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });
  after(() => {
    console.log.restore();
    console.error.restore();
  });

  it("Copies the .types folder for react template", () => {
    newTempBase(TEMPLATE_CONFIGS.get("react"));
    testDirectoryContentsEqual(
      ".types", path.join(SOURCE_TEMPLATES.get("react"), ".types")
    );
  });
  it("Copies svelte.config.js for svelte-typescript template", () => {
    newTempBase(TEMPLATE_CONFIGS.get("svelte-typescript"));
    const baseSvelteConfig = path.join(
      SOURCE_TEMPLATES.get("svelte-typescript"), "svelte.config.js"
    );
    expect(file("svelte.config.js")).to.equal(file(baseSvelteConfig));
  });
  it("Copies babel.config.json for lit-element template", () => {
    newTempBase(TEMPLATE_CONFIGS.get("lit-element"));
    const baseBabelConfig = path.join(
      SOURCE_TEMPLATES.get("lit-element"), "babel.config.json"
    );
    expect(file("babel.config.json")).to.equal(file(baseBabelConfig));
  });
  it("Copies babel.config.json for lit-element-typescript template", () => {
    newTempBase(TEMPLATE_CONFIGS.get("lit-element-typescript"));
    const baseBabelConfig = path.join(
      SOURCE_TEMPLATES.get("lit-element-typescript"), "babel.config.json"
    );
    expect(file("babel.config.json")).to.equal(file(baseBabelConfig));
  });
});

function testPackageJsonScriptsEqual(template) {
  const tempPackageJson = newTempPackageJson(TEMPLATE_CONFIGS.get(template));
  const basePackageJson = require(
    path.join(SOURCE_TEMPLATES.get(template), "package.json")
  );
  expect(tempPackageJson.scripts).to.eql(basePackageJson.scripts);
}

describe("generatePackageJson", () => {
  it("Generates scripts property for none template", () => {
    testPackageJsonScriptsEqual("none");
  });
  it("Generates scripts property for none-typescript template", () => {
    testPackageJsonScriptsEqual("none-typescript");
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
  installPackages(TEMPLATE_CONFIGS.get(template));
  expect(execa.sync).to.have.been.calledTwice;
  const installedProdPackages = execa.sync.args[0][1];
  const installedDevPackages = execa.sync.args[1][1];
  const basePackageJson = require(
    path.join(SOURCE_TEMPLATES.get(template), "package.json")
  );
  const baseProdPackages = Object.keys(basePackageJson.dependencies);
  const baseDevPackages = Object.keys(basePackageJson.devDependencies);
  installedProdPackages.sort();
  installedDevPackages.sort();
  baseProdPackages.sort();
  baseDevPackages.sort();
  expect(installedProdPackages).to.eql(baseProdPackages);
  expect(installedDevPackages).to.eql(baseDevPackages);
}

describe("installPackages", () => {
  before(() => {
    sinon.stub(console, "log");
    sinon.stub(execa, "sync");
  });
  beforeEach(() => {
    execa.sync.reset();
  });
  after(() => {
    console.log.restore();
    execa.sync.restore();
  });

  it("Installs packages for none template", () => {
    installPackages(TEMPLATE_CONFIGS.get("none"));
    expect(execa.sync).to.have.been.calledOnce;
    const installedDevPackages = execa.sync.args[0][1];
    const basePackageJson = require(
      path.join(SOURCE_TEMPLATES.get("none"), "package.json")
    );
    const baseDevPackages = Object.keys(basePackageJson.devDependencies);
    installedDevPackages.sort();
    baseDevPackages.sort();
    expect(installedDevPackages).to.eql(baseDevPackages);
  });
  it("Installs packages for none-typescript template", () => {
    installPackages(TEMPLATE_CONFIGS.get("none-typescript"));
    expect(execa.sync).to.have.been.calledOnce;
    const installedDevPackages = execa.sync.args[0][1];
    const basePackageJson = require(
      path.join(SOURCE_TEMPLATES.get("none-typescript"), "package.json")
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
  const tempSnowpackConfig = newTempSnowpackConfig(
    TEMPLATE_CONFIGS.get(template)
  );
  const baseSnowpackConfig = require(
    path.join(SOURCE_TEMPLATES.get(template), "snowpack.config.js")
  );
  expect(tempSnowpackConfig).to.eql(baseSnowpackConfig);
}

describe("generateSnowpackConfig", () => {
  it("Generates snowpack.config.js for none template", () => {
    testSnowpackConfigsEqual("none");
  });
  it("Generates snowpack.config.js for none-typescript template", () => {
    testSnowpackConfigsEqual("none-typescript");
  });
  it("Generates snowpack.config.js for react template", () => {
    testSnowpackConfigsEqual("react");
  });
  it("Generates snowpack.config.js for react-typescript template", () => {
    testSnowpackConfigsEqual("react-typescript");
  });
  it("Generates snowpack.config.js for vue template", () => {
    testSnowpackConfigsEqual("vue");
  });
  it("Generates snowpack.config.js for vue-typescript template", () => {
    testSnowpackConfigsEqual("vue-typescript");
  });
  it("Generates snowpack.config.js for svelte template", () => {
    testSnowpackConfigsEqual("svelte");
  });
  it("Generates snowpack.config.js for svelte-typescript template", () => {
    testSnowpackConfigsEqual("svelte-typescript");
  });
  it("Generates snowpack.config.js for preact template", () => {
    testSnowpackConfigsEqual("preact");
  });
  it("Generates snowpack.config.js for preact-typescript template", () => {
    testSnowpackConfigsEqual("preact-typescript");
  });
  it("Generates snowpack.config.js for lit-element template", () => {
    testSnowpackConfigsEqual("lit-element");
  });
  it("Generates snowpack.config.js for lit-element-typescript template", () => {
    testSnowpackConfigsEqual("lit-element-typescript");
  });
});
