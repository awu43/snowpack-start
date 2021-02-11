/* eslint-disable no-console */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const path = require("path");

const execa = require("execa");
const fse = require("fs-extra");
const rewire = require("rewire");
const tmp = require("tmp");

const chai = require("chai");
const chaiFiles = require("chai-files");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");

chai.use(sinonChai);
chai.use(chaiFiles);
const { expect } = chai;
const { file } = chaiFiles;
const { dir } = chaiFiles;

const getOptions = rewire("./get-options");
const projectDirValidator = getOptions.__get__("projectDirValidator");
const OptionNameError = getOptions.__get__("OptionNameError");
const OptionValueTypeError = getOptions.__get__("OptionValueTypeError");
const validateOptions = getOptions.__get__("validateOptions");

const index = rewire("./index.js");
const fileReadAndReplace = index.__get__("fileReadAndReplace");
const createBase = index.__get__("createBase");
const generatePackageJson = index.__get__("generatePackageJson");
const installPackages = index.__get__("installPackages");
const s = index.__get__("s");
const generateSnowpackConfig = index.__get__("generateSnowpackConfig");

const BASE_FILES = require("../base-files");
// const BASE_TEMPLATE_DIR = require("../base-templates");

const BLANK_CONFIG = { jsFramework: "blank" };

describe("validateOptions", () => {
  it("Throws OptionNameError if unknown option found", () => {
    expect(() => validateOptions({ unknownOpt: "unknown value" }))
      .to.throw(OptionNameError);
    expect(() => validateOptions({ unknownOpt: "unknown value" }))
      .to.throw("Unknown option: unknownOpt");
  });
  it("Throws OptionValueError if option value type is incorrect", () => {
    expect(() => validateOptions({ author: ["should not be an array"] }))
      .to.throw(OptionValueTypeError);
    expect(() => validateOptions({ author: ["should not be an array"] }))
      .to.throw("Expected value of type string for author, received object");
  });
});

describe("projectDirValidator", () => {
  it("Checks if projectDir is empty string", () => {
    expect(projectDirValidator("")).to.equal("No directory provided");
  });
  it("Checks if projectDir is only whitespace", () => {
    expect(projectDirValidator("")).to.equal("No directory provided");
  });
  it("Checks if projectDir already exists", () => {
    const tempDir = tmp.dirSync();
    expect(projectDirValidator(tempDir.name))
      .to.equal("Project directory already exists");
  });
  it("Returns true for a valid projectDir", () => {
    const tempDir = tmp.dirSync();
    tempDir.removeCallback();
    expect(projectDirValidator(tempDir.name)).to.equal(true);
  });
});

describe("fileReadAndReplace", () => {
  it("Modifies a file's contents with a string replace", () => {
    const tempFile = tmp.fileSync();
    fse.writeFileSync(
      tempFile.name, "import index.css\nimport index.js\n", "utf8"
    );
    fileReadAndReplace(tempFile.name, ".css", ".scss");
    const newContents = fse.readFileSync(tempFile.name, "utf8");
    expect(newContents).to.equal("import index.scss\nimport index.js\n");
  });
});

function newTempBase(options) {
  const tempDir = tmp.dirSync();
  tempDir.removeCallback();
  createBase({ projectDir: tempDir.name, ...options });
  return tempDir;
}

describe("createBase", () => {
  before(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });
  after(() => {
    console.log.restore();
    console.error.restore();
  });

  it("Exits with code 1 if projectDir already exists", () => {
    const processExit = sinon.stub(process, "exit");
    const tempDir = tmp.dirSync();
    createBase({ projectDir: tempDir.name });
    expect(processExit).to.have.been.calledWith(1);
    processExit.restore();
  });
  it("Changes the working directory to the project directory", () => {
    const tempDir = newTempBase(BLANK_CONFIG);
    expect(process.cwd()).to.equal(tempDir.name);
  });
  it("Copies robots.txt and .gitignore", () => {
    newTempBase(BLANK_CONFIG);
    expect(file("public/robots.txt"))
      .to.equal(file(BASE_FILES.get("robots.txt")));
    expect(file(".gitignore")).to.equal(file(BASE_FILES.get("gitignore")));
  });
  it("Generates README.md", () => {
    const tempDir = newTempBase(BLANK_CONFIG);
    expect(file("README.md")).to.equal(`# ${path.basename(tempDir.name)}\n`);
  });
  // it("Copies the .types folder of unknown purpose when using JS React", () => {
  //   newTempBase({ jsFramework: "react" });
  //   expect(dir(".types")).to.exist;
  // });
  // it("Copies babel.config.json when using JS LitElement", () => {
  //   newTempBase({ jsFramework: "lit-element" });
  //   const sourceBabelConfig = path.join(
  //     BASE_TEMPLATE_DIR, "snowpack-lit-element", "babel.config.json"
  //   );
  //   expect(file("babel.config.json")).to.equal(file(sourceBabelConfig));
  // });
  // it("Copies babel.config.json when using TS LitElement", () => {
  //   newTempBase({ jsFramework: "lit-element", typescript: true });
  //   const sourceBabelConfig = path.join(
  //     BASE_TEMPLATE_DIR, "snowpack-lit-element-typescript", "babel.config.json"
  //   );
  //   expect(file("babel.config.json")).to.equal(file(sourceBabelConfig));
  // });
  it("Copies types folder and tsconfig.json when using TypeScript", () => {
    newTempBase({ ...BLANK_CONFIG, typescript: true });
    expect(dir("types")).to.exist;
    expect(file("tsconfig.json")).to.exist;
  });
  it("Generates .prettierrc", () => {
    newTempBase({ ...BLANK_CONFIG, codeFormatters: ["prettier"] });
    expect(JSON.parse(fse.readFileSync(".prettierrc"))).to.eql({});
  });
  it("Copies postcss.config.js", () => {
    newTempBase({ jsFramework: "blank", plugins: ["postcss"] });
    expect(file("postcss.config.js"))
      .to.equal(file(BASE_FILES.get("postcssConfig")));
  });
  it("Copies web-test-runner.config.js", () => {
    newTempBase({ jsFramework: "blank", plugins: ["wtr"] });
    expect(file("web-test-runner.config.js"))
      .to.equal(file(BASE_FILES.get("wtrConfig")));
  });
  it("Copies and modifies MIT license", () => {
    newTempBase({ ...BLANK_CONFIG, license: "mit", author: "Jane Doe" });
    const expectedContents = (
      fse.readFileSync(BASE_FILES.get("mit"), "utf8")
        .replace("YYYY Author", `${new Date().getFullYear()} Jane Doe`)
    );
    expect(file("LICENSE")).to.equal(expectedContents);
  });
  it("Copies GPL license", () => {
    newTempBase({ ...BLANK_CONFIG, license: "gpl" });
    expect(file("LICENSE")).to.equal(file(BASE_FILES.get("gpl")));
  });
  it("Copies Apache license", () => {
    newTempBase({ ...BLANK_CONFIG, license: "apache" });
    expect(file("LICENSE")).to.equal(file(BASE_FILES.get("apache")));
  });
  it("Copies no license", () => {
    newTempBase({ ...BLANK_CONFIG, license: null });
    expect(file("LICENSE")).to.not.exist;
  });
});

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
describe("generatePackageJson", () => {
  it("Generates a package.json file", () => {
    const tempDir = tmp.dirSync();
    process.chdir(tempDir.name);
    generatePackageJson(BLANK_CONFIG);
    expect("package.json").to.exist;
  });
  it("Generates a base package.json", () => {
    const packageJson = newTempPackageJson(BLANK_CONFIG);
    expect(packageJson).to.eql({
      private: true,
      scripts: {
        start: "snowpack dev",
        build: "snowpack build",
        // eslint-disable-next-line quotes, no-useless-escape
        test: 'echo \"This template does not include a test runner by default.\" && exit 1',
      },
    });
  });
  it("Adds browserlist if using Webpack", () => {
    const packageJson = newTempPackageJson(
      { ...BLANK_CONFIG, bundler: "webpack" },
    );
    expect(packageJson.browserslist).to.eql(["defaults"]);
  });
  it("Adds a npm script for testing JS files", () => {
    const packageJson = newTempPackageJson(
      { ...BLANK_CONFIG, plugins: ["wtr"] },
    );
    expect(packageJson.scripts.test)
      // eslint-disable-next-line quotes, no-useless-escape
      .to.equal('wtr \"src/**/*.test.js\"');
  });
  it("Adds a npm script for testing JSX files", () => {
    const packageJson = newTempPackageJson(
      { jsFramework: "react", plugins: ["wtr"] },
    );
    expect(packageJson.scripts.test)
      // eslint-disable-next-line quotes, no-useless-escape
      .to.equal('wtr \"src/**/*.test.jsx\"');
  });
  // it("Does not add a npm script for testing if using Vue", () => {
  //   const packageJson = newTempPackageJson(
  //     { jsFramework: "vue", plugins: ["wtr"] },
  //   );
  //   expect(packageJson.scripts.test)
  //     // eslint-disable-next-line quotes, no-useless-escape
  //     .to.equal('echo \"This template does not include a test runner by default.\" && exit 1');
  // });
});

describe("installPackages", () => {
  const execaStub = sinon.stub(execa, "sync");
  before(() => {
    sinon.stub(console, "log");
  });
  after(() => {
    console.log.restore();
  });
  beforeEach(() => {
    execaStub.reset();
  });
  after(() => {
    execaStub.restore();
  });

  it("Installs TypeScript packages", () => {
    const devPackages = [
      "snowpack",
      "typescript",
      "@snowpack/plugin-typescript",
      "@types/snowpack-env",
    ];
    installPackages({ ...BLANK_CONFIG, typescript: true });
    expect(execaStub).to.have.been.calledOnceWithExactly(
      "npm i -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs @types/chai when using TS + WTR", () => {
    const devPackages = [
      "snowpack",
      "typescript",
      "@snowpack/plugin-typescript",
      "@types/snowpack-env",
      "@types/chai",
      "@web/test-runner",
      "chai",
      "@snowpack/web-test-runner-plugin",
    ];
    installPackages({ ...BLANK_CONFIG, typescript: true, plugins: ["wtr"] });
    expect(execaStub).to.have.been.calledOnceWithExactly(
      "npm i -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs ESLint", () => {
    const devPackages = ["snowpack", "eslint"];
    installPackages({ ...BLANK_CONFIG, codeFormatters: ["eslint"] });
    expect(execaStub).to.have.been.calledOnceWithExactly(
      "npm i -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs Prettier", () => {
    const devPackages = ["snowpack", "prettier"];
    installPackages({ ...BLANK_CONFIG, codeFormatters: ["prettier"] });
    expect(execaStub).to.have.been.calledOnceWithExactly(
      "npm i -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs ESLint and Prettier", () => {
    const devPackages = ["snowpack", "eslint", "prettier"];
    installPackages(
      { ...BLANK_CONFIG, codeFormatters: ["eslint", "prettier"] }
    );
    expect(execaStub).to.have.been.calledOnceWithExactly(
      "npm i -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs no CSS framework", () => {
    const devPackages = ["snowpack"];
    installPackages({ ...BLANK_CONFIG, cssFramework: null });
    expect(execaStub).to.have.been.calledOnceWithExactly(
      "npm i -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs Tailwind CSS", () => {
    const devPackages = ["snowpack", "tailwindcss"];
    installPackages({ ...BLANK_CONFIG, cssFramework: "tailwindcss" });
    expect(execaStub).to.have.been.calledOnceWithExactly(
      "npm i -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs Bootstrap", () => {
    const devPackages = ["snowpack", "bootstrap"];
    installPackages({ ...BLANK_CONFIG, cssFramework: "bootstrap" });
    expect(execaStub).to.have.been.calledOnceWithExactly(
      "npm i -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs @snowpack/plugin-webpack", () => {
    const devPackages = ["snowpack", "@snowpack/plugin-webpack"];
    installPackages({ ...BLANK_CONFIG, bundler: "webpack" });
    expect(execaStub).to.have.been.calledOnceWithExactly(
      "npm i -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs plugins (postcss + wtr)", () => {
    const devPackages = [
      "snowpack",
      "postcss",
      "postcss-cli",
      "postcss-preset-env",
      "cssnano",
      "@snowpack/plugin-postcss",
      "@web/test-runner",
      "chai",
      "@snowpack/web-test-runner-plugin",
    ];
    installPackages({ ...BLANK_CONFIG, plugins: ["postcss", "wtr"] });
    expect(execaStub).to.have.been.calledOnceWithExactly(
      "npm i -D", devPackages, { stdio: "inherit" }
    );
  });
});

describe("s", () => {
  it("Returns a number of spaces", () => {
    expect(s(4)).to.equal("    ");
  });
});

const newTempSnowpackConfig = newTempConfigGenerator(
  generateSnowpackConfig, "snowpack.config.js"
);
describe("generateSnowpackConfig", () => {
  it("Generates a snowpack.config.js file", () => {
    const tempDir = tmp.dirSync();
    process.chdir(tempDir.name);
    generateSnowpackConfig(BLANK_CONFIG);
    expect(file("snowpack.config.js")).to.exist;
  });
  it("Generates a base Snowpack configuration", () => {
    const snowpackConfig = newTempSnowpackConfig(BLANK_CONFIG);
    expect(snowpackConfig).to.deep.eql({
      mount: { public: { url: "/", static: true }, src: { url: "/dist" } },
      plugins: [],
      routes: [],
      optimize: {},
      packageOptions: {},
      devOptions: {},
      buildOptions: {},
    });
  });
  it("Adds @snowpack/plugin-typescript if using TypeScript", () => {
    const snowpackConfig = newTempSnowpackConfig(
      { ...BLANK_CONFIG, typescript: true }
    );
    expect(snowpackConfig.plugins).to.eql(["@snowpack/plugin-typescript"]);
  });
  it("Adds @snowpack/plugin-sass if using Sass", () => {
    const snowpackConfig = newTempSnowpackConfig(
      { ...BLANK_CONFIG, sass: true }
    );
    expect(snowpackConfig.plugins).to.eql(["@snowpack/plugin-sass"]);
  });
  it("Deletes exclude if not using Sass", () => {
    const snowpackConfig = newTempSnowpackConfig(BLANK_CONFIG);
    expect(snowpackConfig.exclude).to.be.undefined;
  });
  it("Adds @snowpack/plugin-webpack if using Webpack", () => {
    const snowpackConfig = newTempSnowpackConfig(
      { ...BLANK_CONFIG, bundler: "webpack" }
    );
    expect(snowpackConfig.plugins).to.eql(["@snowpack/plugin-webpack"]);
  });
  it("Adds default built-in bundler settings", () => {
    const snowpackConfig = newTempSnowpackConfig(
      { ...BLANK_CONFIG, bundler: "snowpack" }
    );
    expect(snowpackConfig.optimize).to.eql({
      bundle: true,
      treeshake: true,
      minify: true,
      target: "es2017",
    });
  });
  it("Adds other plugins (prs + pbs)", () => {
    const snowpackConfig = newTempSnowpackConfig(
      { ...BLANK_CONFIG, plugins: ["prs", "pbs"] }
    );
    expect(snowpackConfig.plugins).to.include("@snowpack/plugin-run-script");
    expect(snowpackConfig.plugins).to.deep.include(
      ["@snowpack/plugin-build-script", {}]
    );
    expect(snowpackConfig.plugins).to.have.lengthOf(2);
  });
});
// TODO: Test framework templates
