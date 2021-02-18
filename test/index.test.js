/* eslint-disable quotes */
/* eslint-disable no-useless-escape */
/* eslint-disable no-console */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const path = require("path");

const execa = require("execa");
const fse = require("fs-extra");
const tmp = require("tmp");

const chai = require("chai");
const chaiFiles = require("chai-files");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");

chai.use(sinonChai);
chai.use(chaiFiles);
const { expect } = chai;
const { file } = chaiFiles;

const styles = require("../src/styles.js");
const {
  newTempBase,
  testDirectoryContentsEqual,
  newTempPackageJson,
  newTempSnowpackConfig,
} = require("./test-utils.js");

const {
  projectDirValidator,
  OptionNameError,
  OptionTypeError,
  OptionValueError,
  validateOptions,
} = require("../src/get-options.js")._testing;

const {
  fileReadAndReplace,
  createBase,
  generatePackageJson,
  installPackages,
  s,
  generateSnowpackConfig,
  initializeEslint,
  initializeGit,
  nodeVersionCheck,
} = require("../src/index.js")._testing;

const BASE_FILES = require("../dist-files");
const BASE_TEMPLATES = require("../dist-templates");

const BLANK_CONFIG = { jsFramework: "blank" };

describe("validateOptions", () => {
  before(() => {
    sinon.stub(execa, "commandSync");
  });
  beforeEach(() => {
    execa.commandSync.reset();
  });
  after(() => {
    execa.commandSync.restore();
  });

  it("Throws OptionNameError if unknown option found", () => {
    expect(() => validateOptions({ unknownOpt: "unknown value" }))
      .to.throw(OptionNameError);
    expect(() => validateOptions({ unknownOpt: "unknown value" }))
      .to.throw(
        styles.errorMsg(`Unknown option ${styles.cyanBright("unknownOpt")}`)
      );
  });
  it("Throws OptionTypeError if option value type is incorrect", () => {
    expect(() => validateOptions({ author: ["should not be an array"] }))
      .to.throw(OptionTypeError);
    expect(() => validateOptions({ author: ["should not be an array"] }))
      .to.throw(styles.errorMsg(`Expected value of type ${styles.cyanBright("string")} for ${styles.cyanBright("author")}, received type ${styles.cyanBright("object")} (${styles.cyanBright(["should not be an array"])})`));
  });
  it("Throws OptionValueError if option value choice is invalid", () => {
    expect(() => validateOptions({ bundler: "unsupportedbundler" }))
      .to.throw(OptionValueError);
    expect(() => validateOptions({ bundler: "unsupportedbundler" }))
      .to.throw(styles.errorMsg(`Invalid value ${styles.cyanBright("unsupportedbundler")} for ${styles.cyanBright("bundler")}\nValid values: ${["webpack", "snowpack", "none"].map(c => styles.cyanBright(c)).join("/")}`));
  });
  it("Throws OptionValueError if option values are invalid", () => {
    const invalidOptions = { codeFormatters: ["eslint", "pylint"] };
    expect(() => validateOptions(invalidOptions)).to.throw(OptionValueError);
    expect(() => validateOptions(invalidOptions))
      .to.throw(styles.errorMsg(`Invalid value ${styles.cyanBright(invalidOptions.codeFormatters)} for ${styles.cyanBright("codeFormatters")}\nValid values: ${["eslint", "prettier"].map(c => styles.cyanBright(c)).join("/")}`));
  });
  it("Throws Error if useYarn and usePnpm are both passed", () => {
    expect(() => validateOptions({ useYarn: true, usePnpm: true }))
      .to.throw(styles.errorMsg("You can't use Yarn and pnpm at the same time"));
    expect(execa.commandSync).to.not.have.been.called;
  });
  it("Throws Error if Yarn is not installed", () => {
    execa.commandSync.throws();
    expect(() => validateOptions({ useYarn: true }))
      .to.throw(styles.errorMsg("Yarn doesn't seem to be installed"));
    expect(execa.commandSync)
      .to.have.been.calledOnceWithExactly("yarn --version");
  });
  it("Throws Error if Pnpm is not installed", () => {
    execa.commandSync.throws();
    expect(() => validateOptions({ usePnpm: true }))
      .to.throw(styles.errorMsg("pnpm doesn't seem to be installed"));
    expect(execa.commandSync)
      .to.have.been.calledOnceWithExactly("pnpm --version");
  });
});

describe("projectDirValidator", () => {
  it("Checks if projectDir is empty string", () => {
    expect(projectDirValidator("")).to.equal("No directory provided");
  });
  it("Checks if projectDir is only whitespace", () => {
    expect(projectDirValidator(" ")).to.equal("No directory provided");
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
    sinon.stub(process, "exit");
    const tempDir = tmp.dirSync();
    createBase({ projectDir: tempDir.name });
    expect(process.exit).to.have.been.calledWith(1);
    process.exit.restore();
  });
  it("Changes the working directory to the project directory", () => {
    const tempDir = newTempBase(BLANK_CONFIG);
    expect(process.cwd()).to.equal(tempDir.name);
  });
  it("Copies .gitignore", () => {
    newTempBase(BLANK_CONFIG);
    expect(file(".gitignore")).to.equal(file(BASE_FILES.get("gitignore")));
  });
  it("Generates README.md", () => {
    newTempBase(BLANK_CONFIG);
    expect(file("README.md")).to.exist;
  });
  it("Copies public and src folders", () => {
    newTempBase({ jsFramework: "vue", typescript: true });
    testDirectoryContentsEqual(
      "public", path.join(BASE_TEMPLATES.get("vue-typescript"), "public")
    );
    testDirectoryContentsEqual(
      "src", path.join(BASE_TEMPLATES.get("vue-typescript"), "src")
    );
    // vue-ts template tests multiple levels
  });
  it("Copies types folder and tsconfig.json", () => {
    newTempBase({ ...BLANK_CONFIG, typescript: true });
    testDirectoryContentsEqual(
      "types", path.join(BASE_TEMPLATES.get("blank-typescript"), "types")
    );
    expect(file("tsconfig.json")).to.equal(
      file(path.join(BASE_TEMPLATES.get("blank-typescript"), "tsconfig.json"))
    );
  });
  it("Copies .prettierrc", () => {
    newTempBase({ ...BLANK_CONFIG, codeFormatters: ["prettier"] });
    expect(file(".prettierrc")).to.equal(file(BASE_FILES.get("prettierConfig")));
  });
  it("Moves public/index.css to src/index.scss for blank template", () => {
    newTempBase({ ...BLANK_CONFIG, sass: true });
    expect(file("public/index.html")).to.contain("dist/index.css");
    expect(file("public/index.css")).to.not.exist;
    expect(file("src/index.scss")).to.exist;
  });
  it("Moves public/index.css to src/index.scss for blank-typescript template", () => {
    newTempBase({ ...BLANK_CONFIG, typescript: true, sass: true });
    expect(file("public/index.html")).to.contain("dist/index.css");
    expect(file("public/index.css")).to.not.exist;
    expect(file("src/index.scss")).to.exist;
  });
  it("Renames CSS files to SCSS for react template", () => {
    newTempBase({ jsFramework: "react", sass: true });
    expect(file("src/App.css")).to.not.exist;
    expect(file("src/App.scss")).to.exist;
    expect(file("src/index.css")).to.not.exist;
    expect(file("src/index.scss")).to.exist;
  });
  it("Renames CSS files to SCSS for react-typescript template", () => {
    newTempBase({ jsFramework: "react", typescript: true, sass: true });
    expect(file("src/App.css")).to.not.exist;
    expect(file("src/App.scss")).to.exist;
    expect(file("src/index.css")).to.not.exist;
    expect(file("src/index.scss")).to.exist;
  });
  it("Renames CSS files to SCSS for vue-typescript template", () => {
    newTempBase({ jsFramework: "vue", typescript: true, sass: true });
    expect(file("src/components/Bar.module.css")).to.not.exist;
    expect(file("src/components/Bar.module.scss")).to.exist;
    expect(file("src/components/Foo.module.css")).to.not.exist;
    expect(file("src/components/Foo.module.scss")).to.exist;
  });
  it("Renames CSS files to SCSS for preact template", () => {
    newTempBase({ jsFramework: "preact", sass: true });
    expect(file("src/App.css")).to.not.exist;
    expect(file("src/App.scss")).to.exist;
    expect(file("src/index.css")).to.not.exist;
    expect(file("src/index.scss")).to.exist;
  });
  it("Renames CSS files to SCSS for preact-typescript template", () => {
    newTempBase({ jsFramework: "preact", typescript: true, sass: true });
    expect(file("src/App.css")).to.not.exist;
    expect(file("src/App.scss")).to.exist;
    expect(file("src/index.css")).to.not.exist;
    expect(file("src/index.scss")).to.exist;
  });
  it("Moves public/index.css to src/index.scss for lit-element template", () => {
    newTempBase({ jsFramework: "lit-element", sass: true });
    expect(file("public/index.html")).to.contain("dist/index.css");
    expect(file("public/index.css")).to.not.exist;
    expect(file("src/index.scss")).to.exist;
  });
  it("Moves public/index.css to src/index.scss for lit-element-typescript template", () => {
    newTempBase({ jsFramework: "lit-element", typescript: true, sass: true });
    expect(file("public/index.html")).to.contain("dist/index.css");
    expect(file("public/index.css")).to.not.exist;
    expect(file("src/index.scss")).to.exist;
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
        test: 'echo \"This template does not include a test runner by default.\" && exit 1',
      },
    });
  });
  it("Adds scripts for ESLint", () => {
    const packageJson = newTempPackageJson(
      { ...BLANK_CONFIG, codeFormatters: ["eslint"] }
    );
    expect(packageJson).to.eql({
      private: true,
      scripts: {
        start: "snowpack dev",
        build: "snowpack build",
        test: 'echo \"This template does not include a test runner by default.\" && exit 1',
        format: 'eslint --fix \"src/**/*\"',
        lint: 'eslint \"src/**/*\"',
      },
    });
  });
  /// Prettier only is tested in templates
  it("Adds scripts for ESLint and Prettier", () => {
    const packageJson = newTempPackageJson(
      { ...BLANK_CONFIG, codeFormatters: ["eslint", "prettier"] }
    );
    expect(packageJson).to.eql({
      private: true,
      scripts: {
        start: "snowpack dev",
        build: "snowpack build",
        test: 'echo \"This template does not include a test runner by default.\" && exit 1',
        esfix: 'eslint --fix \"src/**/*\"',
        eslint: 'eslint \"src/**/*\"',
        pwrite: 'prettier --write \"src/**/*.js\"',
        pcheck: 'prettier --check \"src/**/*.js\"',
      },
    });
  });
  it("Adds browserlist if using Webpack", () => {
    const packageJson = newTempPackageJson(
      { ...BLANK_CONFIG, bundler: "webpack" },
    );
    expect(packageJson.browserslist).to.eql(["defaults"]);
  });
});

describe("installPackages", () => {
  before(() => {
    sinon.stub(execa, "sync");
    sinon.stub(console, "log");
  });
  beforeEach(() => {
    execa.sync.reset();
  });
  after(() => {
    console.log.restore();
    execa.sync.restore();
  });

  it("Installs TypeScript packages", () => {
    const devPackages = [
      "snowpack",
      "typescript",
      "@snowpack/plugin-typescript",
      "@types/snowpack-env",
    ];
    installPackages({ ...BLANK_CONFIG, typescript: true });
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npm install -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs @types/chai", () => {
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
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npm install -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs ESLint", () => {
    const devPackages = ["snowpack", "eslint"];
    installPackages({ ...BLANK_CONFIG, codeFormatters: ["eslint"] });
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npm install -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs Prettier", () => {
    const devPackages = ["snowpack", "prettier"];
    installPackages({ ...BLANK_CONFIG, codeFormatters: ["prettier"] });
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npm install -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs ESLint and Prettier", () => {
    const devPackages = ["snowpack", "eslint", "prettier"];
    installPackages(
      { ...BLANK_CONFIG, codeFormatters: ["eslint", "prettier"] }
    );
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npm install -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs @snowpack/plugin-sass", () => {
    const devPackages = ["snowpack", "@snowpack/plugin-sass"];
    installPackages(
      { ...BLANK_CONFIG, sass: true }
    );
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npm install -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs no CSS framework", () => {
    const devPackages = ["snowpack"];
    installPackages({ ...BLANK_CONFIG, cssFramework: null });
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npm install -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs Tailwind CSS", () => {
    const devPackages = ["snowpack", "tailwindcss"];
    installPackages({ ...BLANK_CONFIG, cssFramework: "tailwindcss" });
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npm install -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs Bootstrap", () => {
    const devPackages = ["snowpack", "bootstrap"];
    installPackages({ ...BLANK_CONFIG, cssFramework: "bootstrap" });
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npm install -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs @snowpack/plugin-webpack", () => {
    const devPackages = ["snowpack", "@snowpack/plugin-webpack"];
    installPackages({ ...BLANK_CONFIG, bundler: "webpack" });
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npm install -D", devPackages, { stdio: "inherit" }
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
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npm install -D", devPackages, { stdio: "inherit" }
    );
  });
  it("Installs packages using Yarn", () => {
    installPackages({ ...BLANK_CONFIG, useYarn: true });
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "yarn add -D", ["snowpack"], { stdio: "inherit" }
    );
  });
  it("Installs packages using pnpm", () => {
    installPackages({ ...BLANK_CONFIG, usePnpm: true });
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "pnpm add -D", ["snowpack"], { stdio: "inherit" }
    );
  });
});

describe("s", () => {
  it("Returns a number of spaces", () => {
    expect(s(4)).to.equal("    ");
  });
});

describe("generateSnowpackConfig", () => {
  it("Generates a snowpack.config.js file", () => {
    const tempDir = tmp.dirSync();
    process.chdir(tempDir.name);
    generateSnowpackConfig(BLANK_CONFIG);
    expect(file("snowpack.config.js")).to.exist;
  });
  it("Generates a base Snowpack configuration", () => {
    const snowpackConfig = newTempSnowpackConfig(BLANK_CONFIG);
    expect(snowpackConfig).to.eql({
      mount: { public: { url: "/", static: true }, src: { url: "/dist" } },
      plugins: [],
      routes: [],
      optimize: {},
      packageOptions: {},
      devOptions: {},
      buildOptions: {},
    });
  });
  it("Adds @snowpack/plugin-typescript", () => {
    const snowpackConfig = newTempSnowpackConfig(
      { ...BLANK_CONFIG, typescript: true }
    );
    expect(snowpackConfig.plugins).to.eql(["@snowpack/plugin-typescript"]);
  });
  it("Adds @snowpack/plugin-sass", () => {
    const snowpackConfig = newTempSnowpackConfig(
      { ...BLANK_CONFIG, sass: true }
    );
    expect(snowpackConfig.exclude).to.eql(["_*.scss"]);
    expect(snowpackConfig.plugins).to.eql(["@snowpack/plugin-sass"]);
  });
  it("Removes exclude property", () => {
    const snowpackConfig = newTempSnowpackConfig(BLANK_CONFIG);
    expect(snowpackConfig.exclude).to.be.undefined;
  });
  it("Adds @snowpack/plugin-webpack", () => {
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
  it("Adds other plugins (srs + sbs)", () => {
    const snowpackConfig = newTempSnowpackConfig(
      { ...BLANK_CONFIG, plugins: ["srs", "sbs"] }
    );
    expect(snowpackConfig.plugins).to.eql([
      [
        "@snowpack/plugin-run-script",
        {
          cmd: 'echo \"production build command.\"',
          watch: 'echo \"dev server command.\"',
        }
      ],
      [
        "@snowpack/plugin-build-script",
        {
          input: [],
          output: [],
          cmd: 'echo \"build command.\"',
        }
      ]
    ]);
  });
});

describe("initializeEslint", () => {
  before(() => {
    sinon.stub(execa, "sync");
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });
  beforeEach(() => {
    execa.sync.reset();
    console.log.reset();
    console.error.reset();
  });
  after(() => {
    console.error.restore();
    console.log.restore();
    execa.sync.restore();
  });

  it("Skips initialization", () => {
    initializeEslint({ codeFormatters: ["eslint"], skipEslintInit: true });
    expect(execa.sync).to.not.have.been.called;
    expect(console.log).to.have.been.calledOnceWithExactly(
      styles.warningMsg("\n- Skipping ESLint init.\n")
    );
  });
  it("Initializes ESLint", () => {
    initializeEslint({ codeFormatters: ["eslint"] });
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npx eslint --init", { stdio: "inherit" }
    );
  });
  it("Displays an error message", () => {
    execa.sync.throws();
    initializeEslint({ codeFormatters: ["eslint"] });
    expect(console.error).to.have.been.calledTwice;
    expect(console.error.secondCall).to.have.been.calledWithExactly(
      `\n  - ${styles.warningMsg("Something went wrong.\n")}`
    );
  });
});

describe("initializeGit", () => {
  before(() => {
    sinon.stub(execa, "sync");
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });
  beforeEach(() => {
    execa.sync.reset();
    console.log.reset();
    console.error.reset();
  });
  after(() => {
    console.error.restore();
    console.log.restore();
    execa.sync.restore();
  });

  it("Skips initialization", () => {
    initializeGit({ skipGitInit: true });
    expect(execa.sync).to.not.have.been.called;
    expect(console.log).to.have.been.calledOnceWithExactly(
      styles.warningMsg("\n- Skipping git init.\n")
    );
  });
  it("Initializes a git repository", () => {
    initializeGit({});
    expect(execa.sync.firstCall).to.have.been.calledWithExactly(
      "git init", { stdio: "inherit" }
    );
    expect(execa.sync.secondCall).to.have.been.calledWithExactly(
      "git add -A", { stdio: "inherit" }
    );
    expect(execa.sync.thirdCall).to.have.been.calledWithExactly(
      "git commit -m \"Intial commit\"", { stdio: "inherit" }
    );
  });
  it("Displays an error message", () => {
    execa.sync.throws();
    initializeGit({});
    expect(console.error).to.have.been.calledTwice;
    expect(console.error.secondCall).to.have.been.calledWithExactly(
      `\n  - ${styles.warningMsg("Something went wrong.\n")}`
    );
  });
});

describe("nodeVersionCheck", () => {
  before(() => {
    sinon.stub(console, "error");
    sinon.stub(process, "exit");
  });
  after(() => {
    process.exit.restore();
    console.error.restore();
  });

  it("Exits with code 1 if Node version < 10", () => {
    const stub = sinon.stub(process, "versions").get(() => ({ node: "9.0.0" }));
    nodeVersionCheck();
    expect(console.error.firstCall).to.have.been.calledWithExactly(
      styles.fatalError("Node v9 is unsupported.")
    );
    expect(console.error.secondCall).to.have.been.calledWithExactly(
      styles.errorMsg("Please use Node v10 or higher.")
    );
    expect(process.exit).to.have.been.calledWith(1);
    stub.restore();
  });
});
