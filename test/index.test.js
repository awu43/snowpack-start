/* eslint-disable quotes */
/* eslint-disable no-useless-escape */
const path = require("path");

const execa = require("execa");
const fse = require("fs-extra");
const JSON5 = require("json5");
const tmp = require("tmp");

const chai = require("chai");
const chaiFiles = require("chai-files");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");

chai.use(sinonChai);
chai.use(chaiFiles);
const { expect } = chai;
const { file } = chaiFiles;

const styles = require("../src/styles.ts");
const {
  stripPackageVersions,
  newTempBase,
  testDirectoryContentsEqual,
  checkCssRenamed,
  newTempPackageJson,
  newTempSnowpackConfig,
  parseExecaProdArgs,
  parseExecaDevArgs,
} = require("./test-utils.js");

const {
  REACT_TEMPLATES,
  s,
  templateName,
  fileReadAndReplace,
  generateSvelteConfig,
  hasJestConfig,
  createBase,
  DEFAULT_BROWSERSLIST,
  generatePackageJson,
  packageMajorVersion,
  installPackages,
  generateSnowpackConfig,
  initializeTailwind,
  initializeEslint,
  initializeGit,
  formatCommand,
  displayQuickstart,
  nodeVersionCheck,
} = require("../src/index.ts")._testing;

const DIST_FILES = require("../src/dist-files.ts");
const DIST_TEMPLATES = require("../src/dist-templates.ts");

const BLANK_CONFIG = { baseTemplate: "blank" };

describe("stripPackageVersions", () => {
  it("Strips 3 from vue@3", () => {
    expect(stripPackageVersions(["vue@3"])).to.eql(["vue"]);
  });
  it("Strips 3.0 from vue@3.0", () => {
    expect(stripPackageVersions(["vue@3.0"])).to.eql(["vue"]);
  });
  it("Strips 3.0.0 from vue@3.0.0", () => {
    expect(stripPackageVersions(["vue@3.0.0"])).to.eql(["vue"]);
  });
});

describe("s", () => {
  it("Returns a number of spaces", () => {
    expect(s(4)).to.equal("    ");
  });
});

describe("templateName", () => {
  it("Returns the full template name", () => {
    expect(templateName({ baseTemplate: "react", typescript: true }))
      .to.equal("react-typescript");
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

describe("generateSvelteConfig", () => {
  beforeEach(() => {
    const tempDir = tmp.dirSync();
    process.chdir(tempDir.name);
  });

  it("Removes postcss property", () => {
    generateSvelteConfig({ typescript: true });
    expect(file("svelte.config.js")).to.not.contain("postcss");
  });
  it("Removes empty brackets", () => {
    generateSvelteConfig({ typescript: true });
    expect(file("svelte.config.js")).to.contain("autoPreprocess()");
  });
  it("Removes require('tailwindcss')", () => {
    generateSvelteConfig({ plugins: ["postcss"] });
    expect(file("svelte.config.js")).to.not.contain("require('tailwindcss')");
  });
  it("Removes require('cssnano') when using Snowpack bundler", () => {
    generateSvelteConfig({ bundler: "snowpack", plugins: ["postcss"] });
    expect(file("svelte.config.js")).to.contain("postcss");
    expect(file("svelte.config.js")).to.not.contain("require('cssnano')");
  });
});

describe("hasJestConfig", () => {
  it("Returns whether a Snowpack config for Jest is available", () => {
    for (const t of REACT_TEMPLATES) {
      expect(hasJestConfig({ baseTemplate: t })).to.be.true;
    }
    expect(hasJestConfig({ baseTemplate: "svelte" })).to.be.true;
    expect(hasJestConfig({ baseTemplate: "svelte", typescript: true }))
      .to.be.false;
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
    expect(file(".gitignore")).to.equal(file(DIST_FILES.get("gitignore")));
  });
  it("Generates README.md for npm", () => {
    newTempBase(BLANK_CONFIG);
    expect(file("README.md")).to.match(/\bnpm\b/);
    expect(file("README.md")).to.not.match(/\byarn\b/);
    expect(file("README.md")).to.not.match(/\bpnpm\b/);
  });
  it("Generates README.md for yarn", () => {
    newTempBase({ ...BLANK_CONFIG, useYarn: true });
    expect(file("README.md")).to.not.match(/\bnpm\b/);
    expect(file("README.md")).to.match(/\byarn\b/);
    expect(file("README.md")).to.not.match(/\bpnpm\b/);
  });
  it("Generates README.md for pnpm", () => {
    newTempBase({ ...BLANK_CONFIG, usePnpm: true });
    expect(file("README.md")).to.not.match(/\bnpm\b/);
    expect(file("README.md")).to.not.match(/\byarn\b/);
    expect(file("README.md")).to.match(/\bpnpm\b/);
  });
  it("Copies public and src folders", () => {
    newTempBase({ baseTemplate: "vue", typescript: true });
    testDirectoryContentsEqual(
      "public", path.join(DIST_TEMPLATES.get("vue-typescript"), "public")
    );
    testDirectoryContentsEqual(
      "src", path.join(DIST_TEMPLATES.get("vue-typescript"), "src")
    );
  });
  it("Copies types folder and tsconfig.json", () => {
    newTempBase({ ...BLANK_CONFIG, typescript: true });
    testDirectoryContentsEqual(
      "types", path.join(DIST_TEMPLATES.get("blank-typescript"), "types")
    );
    expect(file("tsconfig.json")).to.equal(
      file(path.join(DIST_TEMPLATES.get("blank-typescript"), "tsconfig.json"))
    );
  });
  it("Replaces mocha in tsconfig.json for react-typescript template", () => {
    newTempBase({ baseTemplate: "react", typescript: true, testing: "jest" });
    const tsConfig = JSON5.parse(fse.readFileSync("tsconfig.json"));
    expect(tsConfig.compilerOptions.types).to.eql([
      "jest",
      "@testing-library/jest-dom",
      "snowpack-env",
    ]);
  });
  it("Replaces mocha in tsconfig.json for react-redux-typescript template", () => {
    newTempBase({ baseTemplate: "react-redux", typescript: true, testing: "jest" });
    const tsConfig = JSON5.parse(fse.readFileSync("tsconfig.json"));
    expect(tsConfig.compilerOptions.types).to.eql([
      "jest",
      "@testing-library/jest-dom",
      "snowpack-env",
    ]);
  });
  it("Replaces mocha in tsconfig.json for react-typescript template", () => {
    newTempBase({ baseTemplate: "react", typescript: true, testing: "jest" });
    const tsConfig = JSON5.parse(fse.readFileSync("tsconfig.json"));
    expect(tsConfig.compilerOptions.types).to.eql([
      "jest",
      "@testing-library/jest-dom",
      "snowpack-env",
    ]);
  });
  it("Replaces mocha in tsconfig.json for preact-typescript template", () => {
    newTempBase({ baseTemplate: "preact", typescript: true, testing: "jest" });
    const tsConfig = JSON5.parse(fse.readFileSync("tsconfig.json"));
    expect(tsConfig.compilerOptions.types).to.eql([
      "jest",
      "@testing-library/jest-dom",
      "snowpack-env",
    ]);
  });
  it("Removes mocha from tsconfig.json for react-typescript template", () => {
    newTempBase({ baseTemplate: "react", typescript: true });
    const tsConfig = JSON5.parse(fse.readFileSync("tsconfig.json"));
    expect(tsConfig.compilerOptions.types).to.eql(["snowpack-env"]);
  });
  it("Removes mocha from tsconfig.json for react-redux-typescript template", () => {
    newTempBase({ baseTemplate: "react-redux", typescript: true });
    const tsConfig = JSON5.parse(fse.readFileSync("tsconfig.json"));
    expect(tsConfig.compilerOptions.types).to.eql(["snowpack-env"]);
  });
  it("Removes mocha from tsconfig.json for svelte-typescript template", () => {
    newTempBase({ baseTemplate: "svelte", typescript: true });
    const tsConfig = JSON5.parse(fse.readFileSync("tsconfig.json"));
    expect(tsConfig.compilerOptions.types).to.eql(["snowpack-env"]);
  });
  it("Removes mocha from tsconfig.json for preact-typescript template", () => {
    newTempBase({ baseTemplate: "preact", typescript: true });
    const tsConfig = JSON5.parse(fse.readFileSync("tsconfig.json"));
    expect(tsConfig.compilerOptions.types).to.eql(["snowpack-env"]);
  });
  it("Copies web-test-runner.config.js", () => {
    newTempBase({ baseTemplate: "blank", testing: "wtr" });
    expect(file("web-test-runner.config.js"))
      .to.equal(file(DIST_FILES.get("wtrConfig")));
  });
  it("Does not set up Jest for blank templates", () => {
    newTempBase({ baseTemplate: "blank", testing: "jest" });
    expect(file("jest.setup.js")).to.not.exist;
    expect(file("jest.config.js")).to.not.exist;
    expect(file("babel.config.json")).to.not.exist;

    newTempBase({ baseTemplate: "blank", typescript: true, testing: "jest" });
    expect(file("jest.setup.js")).to.not.exist;
    expect(file("jest.config.js")).to.not.exist;
    expect(file("babel.config.json")).to.not.exist;
  });
  it("Sets up Jest for react template", () => {
    newTempBase({
      baseTemplate: "react",
      jsFramework: "react",
      testing: "jest",
    });

    expect(file("jest.setup.js")).to.equal(file(DIST_FILES.get("jestSetup")));
    expect(file("jest.config.js")).to.contain("app-scripts-react");
    expect(file("babel.config.json")).to.contain("app-scripts-react");

    expect(file("src/App.test.jsx")).to.not.contain("document.body.contains");
    expect(file("src/App.test.jsx")).to.contain("toBeInTheDocument");
    expect(file("src/App.test.jsx")).to.not.contain("chai");
  });
  it("Sets up Jest for react-typescript template", () => {
    newTempBase({
      baseTemplate: "react",
      jsFramework: "react",
      typescript: true,
      testing: "jest",
    });
    expect(file("jest.setup.js")).to.equal(file(DIST_FILES.get("jestSetup")));
    expect(file("jest.config.js")).to.contain("app-scripts-react");
    expect(file("babel.config.json")).to.contain("app-scripts-react");

    expect(file("src/App.test.tsx")).to.not.contain("document.body.contains");
    expect(file("src/App.test.tsx")).to.contain("toBeInTheDocument");
    expect(file("src/App.test.tsx")).to.not.contain("chai");
  });
  it("Sets up Jest for react-redux template", () => {
    newTempBase({
      baseTemplate: "react-redux",
      jsFramework: "react",
      testing: "jest",
    });

    expect(file("jest.setup.js")).to.equal(file(DIST_FILES.get("jestSetup")));
    expect(file("jest.config.js")).to.contain("app-scripts-react");
    expect(file("babel.config.json")).to.contain("app-scripts-react");

    expect(file("src/App.test.jsx")).to.not.contain("document.body.contains");
    expect(file("src/App.test.jsx")).to.contain("toBeInTheDocument");
    expect(file("src/App.test.jsx")).to.not.contain("chai");
    expect(file("src/features/counter/counterSlice.test.js"))
      .to.not.contain("to.eql");
    expect(file("src/features/counter/counterSlice.test.js"))
      .to.contain("toEqual");
  });
  it("Sets up Jest for react-redux-typescript template", () => {
    newTempBase({
      baseTemplate: "react-redux",
      jsFramework: "react",
      typescript: true,
      testing: "jest",
    });
    expect(file("jest.setup.js")).to.equal(file(DIST_FILES.get("jestSetup")));
    expect(file("jest.config.js")).to.contain("app-scripts-react");
    expect(file("babel.config.json")).to.contain("app-scripts-react");

    expect(file("src/App.test.tsx")).to.not.contain("document.body.contains");
    expect(file("src/App.test.tsx")).to.contain("toBeInTheDocument");
    expect(file("src/App.test.tsx")).to.not.contain("chai");
    expect(file("src/features/counter/counterSlice.test.ts"))
      .to.not.contain("to.eql");
    expect(file("src/features/counter/counterSlice.test.ts"))
      .to.contain("toEqual");
  });
  it("Does not set up Jest for vue templates", () => {
    newTempBase({ baseTemplate: "vue", testing: "jest" });
    expect(file("jest.setup.js")).to.not.exist;
    expect(file("jest.config.js")).to.not.exist;
    expect(file("babel.config.json")).to.not.exist;

    newTempBase({ baseTemplate: "vue", typescript: true, testing: "jest" });
    expect(file("jest.setup.js")).to.not.exist;
    expect(file("jest.config.js")).to.not.exist;
    expect(file("babel.config.json")).to.not.exist;
  });
  it("Sets up Jest for svelte template", () => {
    newTempBase({
      baseTemplate: "svelte",
      jsFramework: "svelte",
      testing: "jest",
    });

    expect(file("jest.setup.js")).to.equal(file(DIST_FILES.get("jestSetup")));
    expect(file("jest.config.js")).to.contain("app-scripts-svelte");
    expect(file("babel.config.json")).to.not.exist;

    expect(file("src/App.test.js")).to.not.contain("document.body.contains");
    expect(file("src/App.test.js")).to.contain("toBeInTheDocument");
    expect(file("src/App.test.js")).to.not.contain("chai");
  });
  it("Does not set up Jest for svelte-typescript template", () => {
    newTempBase({ baseTemplate: "svelte", typescript: true, testing: "jest" });
    expect(file("jest.setup.js")).to.not.exist;
    expect(file("jest.config.js")).to.not.exist;
    expect(file("babel.config.json")).to.not.exist;
  });
  it("Does not set up Jest for lit-element templates", () => {
    newTempBase({ baseTemplate: "lit-element", testing: "jest" });
    expect(file("jest.setup.js")).to.not.exist;
    expect(file("jest.config.js")).to.not.exist;
    expect(file("babel.config.json"))
      .to.not.equal(file(DIST_FILES.get("jestBabel")));

    newTempBase({
      baseTemplate: "lit-element",
      typescript: true,
      testing: "jest",
    });
    expect(file("jest.setup.js")).to.not.exist;
    expect(file("jest.config.js")).to.not.exist;
    expect(file("babel.config.json"))
      .to.not.equal(file(DIST_FILES.get("jestBabel")));
  });
  it("Copies .prettierrc", () => {
    newTempBase({ ...BLANK_CONFIG, codeFormatters: ["prettier"] });
    expect(file(".prettierrc")).to.equal(file(DIST_FILES.get("prettierConfig")));
  });
  it("Renames CSS files to SCSS for blank templates", () => {
    newTempBase({ ...BLANK_CONFIG, sass: true });
    expect(file("src/index.css")).to.not.exist;
    expect(file("src/index.scss")).to.exist;

    newTempBase({ ...BLANK_CONFIG, typescript: true, sass: true });
    expect(file("src/index.css")).to.not.exist;
    expect(file("src/index.scss")).to.exist;
  });
  it("Renames CSS to SCSS and updates imports for react templates", () => {
    newTempBase({ baseTemplate: "react", sass: true });
    checkCssRenamed("src/App.jsx");
    checkCssRenamed("src/index.jsx");

    newTempBase({ baseTemplate: "react", typescript: true, sass: true });
    checkCssRenamed("src/App.tsx");
    checkCssRenamed("src/index.tsx");
  });
  it("Renames CSS to SCSS and updates imports for react-redux templates", () => {
    newTempBase({ baseTemplate: "react-redux", sass: true });
    checkCssRenamed("src/App.jsx");
    checkCssRenamed("src/index.jsx");
    checkCssRenamed("src/features/counter/Counter.jsx", true);

    newTempBase({ baseTemplate: "react-redux", typescript: true, sass: true });
    checkCssRenamed("src/App.tsx");
    checkCssRenamed("src/index.tsx");
    checkCssRenamed("src/features/counter/Counter.tsx", true);
  });
  it("Does not rename any CSS files for vue templates", () => {
    sinon.stub(fse, "renameSync");
    newTempBase({ baseTemplate: "vue", sass: true });
    expect(fse.renameSync).to.not.have.been.called;
    fse.renameSync.resetHistory();

    newTempBase({ baseTemplate: "vue", typescript: true, sass: true });
    expect(fse.renameSync).to.not.have.been.called;
    fse.renameSync.restore();
  });
  it("Does not rename any CSS files for svelte templates", () => {
    sinon.stub(fse, "renameSync");
    newTempBase({ baseTemplate: "svelte", sass: true });
    expect(fse.renameSync).to.not.have.been.called;
    fse.renameSync.resetHistory();

    newTempBase({ baseTemplate: "svelte", typescript: true, sass: true });
    expect(fse.renameSync).to.not.have.been.called;
    fse.renameSync.restore();
  });
  it("Renames CSS to SCSS and updates imports for preact templates", () => {
    newTempBase({ baseTemplate: "preact", sass: true });
    checkCssRenamed("src/App.jsx");
    checkCssRenamed("src/index.jsx");

    newTempBase({ baseTemplate: "preact", typescript: true, sass: true });
    checkCssRenamed("src/App.tsx");
    checkCssRenamed("src/index.tsx");
  });
  it("Renames CSS files to SCSS for lit-element templates", () => {
    newTempBase({ baseTemplate: "lit-element", sass: true });
    expect(file("src/index.css")).to.not.exist;
    expect(file("src/index.scss")).to.exist;

    newTempBase({ baseTemplate: "lit-element", typescript: true, sass: true });
    expect(file("src/index.css")).to.not.exist;
    expect(file("src/index.scss")).to.exist;
  });
  it("Copies resolveProxyImports-plugin.js when using Snowpack bundler", () => {
    newTempBase({ baseTemplate: "blank", bundler: "snowpack" });
    expect(file("resolveProxyImports-plugin.js"))
      .to.equal(file(DIST_FILES.get("resolveProxyImports")));
  });
  it("Generates postcss.config.js", () => {
    newTempBase({ ...BLANK_CONFIG, plugins: ["postcss"] });
    expect(file("postcss.config.js")).to.exist;
  });
  it("Removes TailwindCSS from postcss.config.js", () => {
    newTempBase({ ...BLANK_CONFIG, plugins: ["postcss"] });
    expect(file("postcss.config.js")).to.not.contain("require('tailwindcss')");
  });
  it("Removes cssnano from postcss.config.js when using Snowpack bundler", () => {
    newTempBase({ ...BLANK_CONFIG, bundler: "snowpack", plugins: ["postcss"] });
    expect(file("postcss.config.js")).to.not.contain("require('cssnano')");
  });
  it("Copies and modifies MIT license", () => {
    newTempBase({ ...BLANK_CONFIG, license: "mit", author: "Jane Doe" });
    const expectedContents = (
      fse.readFileSync(DIST_FILES.get("mit"), "utf8")
        .replace("YYYY Author", `${new Date().getFullYear()} Jane Doe`)
    );
    expect(file("LICENSE")).to.equal(expectedContents);
  });
  it("Copies GPL license", () => {
    newTempBase({ ...BLANK_CONFIG, license: "gpl" });
    expect(file("LICENSE")).to.equal(file(DIST_FILES.get("gpl")));
  });
  it("Copies Apache license", () => {
    newTempBase({ ...BLANK_CONFIG, license: "apache" });
    expect(file("LICENSE")).to.equal(file(DIST_FILES.get("apache")));
  });
  it("Copies no license", () => {
    newTempBase({ ...BLANK_CONFIG, license: "" });
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
        format: 'eslint --fix \"src/**/*.js\"',
        lint: 'eslint \"src/**/*.js\"',
      },
    });
  });
  // Prettier only is tested in templates
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
        esfix: 'eslint --fix \"src/**/*.js\"',
        eslint: 'eslint \"src/**/*.js\"',
        pwrite: 'prettier --write \"src/**/*.js\"',
        pcheck: 'prettier --check \"src/**/*.js\"',
      },
    });
  });
  // WTR scripts are mostly tested by template tests
  it("Adds a test script for react-redux template with WTR", () => {
    const packageJson = newTempPackageJson({
      baseTemplate: "react-redux",
      testing: "wtr"
    });
    expect(packageJson.scripts.test)
      .to.eql('web-test-runner \"src/**/*.test.{jsx,js}\"');
  });
  it("Adds a test script for react-redux-typescript template with WTR", () => {
    const packageJson = newTempPackageJson({
      baseTemplate: "react-redux",
      typescript: true,
      testing: "wtr"
    });
    expect(packageJson.scripts.test)
      .to.eql('web-test-runner \"src/**/*.test.{tsx,ts}\"');
  });
  it("Adds a test script for Jest", () => {
    const packageJson = newTempPackageJson({
      baseTemplate: "react",
      testing: "jest"
    });
    expect(packageJson.scripts.test).to.eql("jest src");
  });
  it("Adds browserlist if using Webpack", () => {
    const packageJson = newTempPackageJson(
      { ...BLANK_CONFIG, bundler: "webpack" },
    );
    expect(packageJson.browserslist).to.eql(DEFAULT_BROWSERSLIST);
  });
  it("Adds browserlist if using PostCSS", () => {
    const packageJson = newTempPackageJson(
      { ...BLANK_CONFIG, plugins: ["postcss"] },
    );
    expect(packageJson.browserslist).to.eql(DEFAULT_BROWSERSLIST);
  });
});

describe("packageMajorVersion", () => {
  it("Finds the major version from semantic versioning", () => {
    expect(packageMajorVersion("4.3.0")).to.equal("4");
  });
});

describe("installPackages", () => {
  before(() => {
    sinon.stub(execa, "sync");
    sinon.stub(console, "log");
  });
  beforeEach(() => {
    execa.sync.resetHistory();
    console.log.resetHistory();
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
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(devPackages);
  });
  it("Installs @types/chai when using TS+WTR", () => {
    installPackages({ ...BLANK_CONFIG, typescript: true, testing: "wtr" });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.include("@types/chai");
  });
  it("Installs Snowpack app script for react templates", () => {
    installPackages({
      baseTemplate: "react",
      jsFramework: "react",
      testing: "jest",
    });
    expect(execa.sync).to.have.been.calledTwice;
    expect(parseExecaDevArgs(execa.sync.args[1][1]))
      .to.include.members(["jest", "@snowpack/app-scripts-react"]);

    execa.sync.resetHistory();
    installPackages({
      baseTemplate: "react",
      jsFramework: "react",
      typescript: "true",
      testing: "jest",
    });
    expect(execa.sync).to.have.been.calledTwice;
    expect(parseExecaDevArgs(execa.sync.args[1][1]))
      .to.include.members(["jest", "@snowpack/app-scripts-react"]);
  });
  it("Installs Snowpack app script for react-redux templates", () => {
    installPackages({
      baseTemplate: "react-redux",
      jsFramework: "react",
      testing: "jest",
    });
    expect(execa.sync).to.have.been.calledTwice;
    expect(parseExecaDevArgs(execa.sync.args[1][1]))
      .to.include.members(["jest", "@snowpack/app-scripts-react"]);

    execa.sync.resetHistory();
    installPackages({
      baseTemplate: "react-redux",
      jsFramework: "react",
      typescript: "true",
      testing: "jest",
    });
    expect(execa.sync).to.have.been.calledTwice;
    expect(parseExecaDevArgs(execa.sync.args[1][1]))
      .to.include.members(["jest", "@snowpack/app-scripts-react"]);
  });
  it("Installs Snowpack app script for svelte template", () => {
    installPackages({
      baseTemplate: "svelte",
      jsFramework: "svelte",
      testing: "jest",
    });
    expect(execa.sync).to.have.been.calledTwice;
    expect(parseExecaDevArgs(execa.sync.args[1][1]))
      .to.include.members(["jest", "@snowpack/app-scripts-svelte"]);
  });
  it("Installs Snowpack app script for preact templates", () => {
    installPackages({
      baseTemplate: "preact",
      jsFramework: "preact",
      testing: "jest",
    });
    expect(execa.sync).to.have.been.calledTwice;
    expect(parseExecaDevArgs(execa.sync.args[1][1]))
      .to.include.members(["jest", "@snowpack/app-scripts-preact"]);

    execa.sync.resetHistory();
    installPackages({
      baseTemplate: "preact",
      jsFramework: "preact",
      typescript: "true",
      testing: "jest",
    });
    expect(execa.sync).to.have.been.calledTwice;
    expect(parseExecaDevArgs(execa.sync.args[1][1]))
      .to.include.members(["jest", "@snowpack/app-scripts-preact"]);
  });
  it("Installs @types/jest when using TS+Jest", () => {
    installPackages({ ...BLANK_CONFIG, typescript: true, testing: "jest" });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.include("@types/jest");
  });
  it("Installs ESLint", () => {
    const devPackages = ["snowpack", "eslint"];
    installPackages({ ...BLANK_CONFIG, codeFormatters: ["eslint"] });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(devPackages);
  });
  it("Installs Prettier", () => {
    const devPackages = ["snowpack", "prettier"];
    installPackages({ ...BLANK_CONFIG, codeFormatters: ["prettier"] });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(devPackages);
  });
  it("Installs ESLint and Prettier", () => {
    const devPackages = ["snowpack", "eslint", "prettier"];
    installPackages(
      { ...BLANK_CONFIG, codeFormatters: ["eslint", "prettier"] }
    );
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(devPackages);
  });
  it("Installs @snowpack/plugin-sass", () => {
    const devPackages = ["snowpack", "@snowpack/plugin-sass"];
    installPackages(
      { ...BLANK_CONFIG, sass: true }
    );
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(devPackages);
  });
  it("Installs no CSS framework", () => {
    const devPackages = ["snowpack"];
    installPackages({ ...BLANK_CONFIG, cssFramework: "" });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(devPackages);
  });
  it("Installs Tailwind CSS", () => {
    const devPackages = ["snowpack", "tailwindcss"];
    installPackages({ ...BLANK_CONFIG, cssFramework: "tailwindcss" });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(devPackages);
  });
  it("Installs cssnano when using PostCSS", () => {
    const devPackages = [
      "snowpack",
      "postcss",
      "postcss-preset-env",
      "@snowpack/plugin-postcss",
      "cssnano",
    ];
    installPackages({ ...BLANK_CONFIG, plugins: ["postcss"] });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(devPackages);
  });
  it("Doesn't install cssnano when using PostCSS with Snowpack bundler", () => {
    const devPackages = [
      "snowpack",
      "postcss",
      "postcss-preset-env",
      "@snowpack/plugin-postcss",
    ];
    installPackages({
      ...BLANK_CONFIG, bundler: "snowpack", plugins: ["postcss"]
    });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(devPackages);
  });
  it("Installs svelte-preprocess when using Svelte and TailwindCSS with PostCSS", () => {
    const devPackages = [
      "snowpack",
      "@snowpack/plugin-svelte",
      "@snowpack/plugin-dotenv",
      "tailwindcss",
      "postcss",
      "postcss-preset-env",
      "@snowpack/plugin-postcss",
      "cssnano",
      "svelte-preprocess",
    ];
    installPackages({
      baseTemplate: "svelte", cssFramework: "tailwindcss", plugins: ["postcss"]
    });
    expect(execa.sync).to.have.been.calledTwice;
    expect(parseExecaProdArgs(execa.sync.args[0][1])).to.eql(["svelte"]);
    expect(parseExecaDevArgs(execa.sync.args[1][1])).to.eql(devPackages);
  });
  it("Installs Bootstrap", () => {
    const devPackages = ["snowpack", "bootstrap"];
    installPackages({ ...BLANK_CONFIG, cssFramework: "bootstrap" });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(devPackages);
  });
  it("Installs @snowpack/plugin-webpack", () => {
    const devPackages = ["snowpack", "@snowpack/plugin-webpack"];
    installPackages({ ...BLANK_CONFIG, bundler: "webpack" });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(devPackages);
  });
  it("Installs plugins", () => {
    const devPackages = [
      "snowpack",
      "postcss",
      "postcss-preset-env",
      "@snowpack/plugin-postcss",
      "cssnano",
    ];
    installPackages({ ...BLANK_CONFIG, plugins: ["postcss"] });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(devPackages);
  });
  it("Installs other prod dependencies", () => {
    installPackages({ ...BLANK_CONFIG, otherProdDeps: ["foo"] });
    expect(execa.sync).to.have.been.calledTwice;
    expect(parseExecaProdArgs(execa.sync.args[0][1])).to.eql(["foo"]);
    expect(parseExecaDevArgs(execa.sync.args[1][1])).to.eql(["snowpack"]);
  });
  it("Does not install duplicate prod dependencies", () => {
    installPackages({ baseTemplate: "vue", otherProdDeps: ["vue"] });
    expect(execa.sync).to.have.been.calledTwice;
    expect(parseExecaProdArgs(execa.sync.args[0][1])).to.eql(["vue"]);
    expect(parseExecaDevArgs(execa.sync.args[1][1]))
      .to.eql(["snowpack", "@snowpack/plugin-vue", "@snowpack/plugin-dotenv"]);
  });
  it("Installs other dev dependencies", () => {
    installPackages({ ...BLANK_CONFIG, otherDevDeps: ["foo"] });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1]))
      .to.eql(["snowpack", "foo"]);
  });
  it("Does not install duplicate dev dependencies", () => {
    installPackages({
      ...BLANK_CONFIG, codeFormatters: ["eslint"], otherDevDeps: ["eslint"]
    });
    expect(execa.sync).to.have.been.calledOnce;
    expect(parseExecaDevArgs(execa.sync.args[0][1]))
      .to.eql(["snowpack", "eslint"]);
  });
  it("Installs packages using Yarn", () => {
    installPackages({ ...BLANK_CONFIG, useYarn: true });
    expect(execa.sync).to.have.been.calledOnce;
    expect(execa.sync.args[0][0]).to.equal("yarn");
    expect(execa.sync.args[0][1].slice(0, 2)).to.eql(["add", "-D"]);
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(["snowpack"]);
  });
  it("Installs packages using pnpm", () => {
    installPackages({ ...BLANK_CONFIG, usePnpm: true });
    expect(execa.sync).to.have.been.calledOnce;
    expect(execa.sync.args[0][0]).to.equal("pnpm");
    expect(execa.sync.args[0][1].slice(0, 2)).to.eql(["add", "-D"]);
    expect(parseExecaDevArgs(execa.sync.args[0][1])).to.eql(["snowpack"]);
  });
});

describe("generateSnowpackConfig", () => {
  it("Generates a snowpack.config.mjs file", () => {
    const tempDir = tmp.dirSync();
    process.chdir(tempDir.name);
    generateSnowpackConfig(BLANK_CONFIG);
    expect(file("snowpack.config.mjs")).to.exist;
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
    expect(snowpackConfig.plugins).to.eql([
      ["@snowpack/plugin-typescript", {
        ...(process.versions.pnp ? { tsc: 'yarn pnpify tsc' } : {})
      }]
    ]);
  });
  it("Adds @snowpack/plugin-babel when using Jest with react template", () => {
    const snowpackConfig = newTempSnowpackConfig({
      baseTemplate: "react",
      jsFramework: "react",
      testing: "jest",
    });
    expect(snowpackConfig.plugins[1]).to.eql("@snowpack/plugin-babel");
  });
  it("Adds @snowpack/plugin-babel when using Jest with react-redux template", () => {
    const snowpackConfig = newTempSnowpackConfig({
      baseTemplate: "react-redux",
      jsFramework: "react",
      testing: "jest",
    });
    expect(snowpackConfig.plugins[1]).to.eql("@snowpack/plugin-babel");
  });
  it("Adds @snowpack/plugin-babel when using Jest with react template", () => {
    const snowpackConfig = newTempSnowpackConfig({
      baseTemplate: "preact",
      jsFramework: "preact",
      testing: "jest",
    });
    expect(snowpackConfig.plugins[0]).to.eql("@snowpack/plugin-babel");
  });
  it("Adds @snowpack/plugin-sass", () => {
    const snowpackConfig = newTempSnowpackConfig(
      { ...BLANK_CONFIG, sass: true }
    );
    expect(snowpackConfig.plugins).to.eql(["@snowpack/plugin-sass"]);
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
      minify: true,
      target: "es2017",
    });
  });
  it("Adds other plugins (srs + sbs)", () => {
    const snowpackConfig = newTempSnowpackConfig(
      { ...BLANK_CONFIG, plugins: ["srs", "sbs"] }
    );
    expect(snowpackConfig.plugins).to.eql([
      ["@snowpack/plugin-run-script", {
        cmd: 'echo \"production build command.\"',
        watch: 'echo \"dev server command.\"',
      }],
      ["@snowpack/plugin-build-script", {
        input: [],
        output: [],
        cmd: 'echo \"build command.\"',
      }],
    ]);
  });
  it("Adds resolveProxyImports-plugin.js when using Snowpack bundler", () => {
    const snowpackConfig = newTempSnowpackConfig(
      { ...BLANK_CONFIG, bundler: "snowpack" }
    );
    expect(snowpackConfig.plugins).to.eql(["./resolveProxyImports-plugin.js"]);
  });
});

describe("initializeTailwind", () => {
  before(() => {
    sinon.stub(execa, "sync");
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });
  beforeEach(() => {
    execa.sync.resetHistory();
    console.log.resetHistory();
    console.error.resetHistory();
  });
  after(() => {
    console.log.restore();
    execa.sync.restore();
    console.error.restore();
  });

  it("Initializes TailwindCSS", () => {
    initializeTailwind({ ...BLANK_CONFIG, cssFramework: "tailwindcss" });
    expect(console.log).to.have.been.calledTwice;
    expect(console.log.firstCall).to.have.been.calledWithExactly(
      styles.cyanBright("\n- Generating tailwind.config.js.")
    );
    expect(execa.sync).to.have.been.calledOnceWithExactly(
      "npx", ["tailwindcss", "init"], { stdio: "inherit" }
    );
    expect(console.log.secondCall).to.have.been.calledWithExactly(
      `\n  - ${styles.successMsg("Success!\n")}`
    );
  });
  it("Skips initializing TailwindCSS", () => {
    initializeTailwind({
      ...BLANK_CONFIG, cssFramework: "tailwindcss", skipTailwindInit: true
    });
    expect(console.log).to.have.been.calledOnceWithExactly(
      styles.warningMsg("\n- Skipping TailwindCSS init.\n")
    );
    expect(execa.sync).to.not.have.been.called;
  });
  it("Displays an error message", () => {
    execa.sync.throws();
    initializeTailwind({ ...BLANK_CONFIG, cssFramework: "tailwindcss" });
    expect(console.error).to.have.been.calledTwice;
    expect(console.error.secondCall).to.have.been.calledWithExactly(
      `\n  - ${styles.warningMsg("Something went wrong.\n")}`
    );
  });
});

describe("initializeEslint", () => {
  before(() => {
    sinon.stub(execa, "sync");
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });
  beforeEach(() => {
    execa.sync.resetHistory();
    console.log.resetHistory();
    console.error.resetHistory();
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
      "npx", ["eslint", "--init"], { stdio: "inherit" }
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
    execa.sync.resetHistory();
    console.log.resetHistory();
    console.error.resetHistory();
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
      "git", ["init"], { stdio: "inherit" }
    );
    expect(execa.sync.secondCall).to.have.been.calledWithExactly(
      "git", ["add", "-A"], { stdio: "inherit" }
    );
    expect(execa.sync.thirdCall).to.have.been.calledWithExactly(
      "git", ["commit", "-m", "\"Intial commit\""], { stdio: "inherit" }
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

describe("displayQuickstart", () => {
  before(() => {
    sinon.stub(console, "log");
  });
  beforeEach(() => {
    console.log.resetHistory();
  });
  after(() => {
    console.log.restore();
  });

  it("Displays quickstart with npm", () => {
    displayQuickstart({}, "");
    expect(console.log).to.have.been.calledWithExactly(
      formatCommand("npm start", "Start your development server.")
    );
    expect(console.log).to.have.been.calledWithExactly(
      formatCommand("npm run build", "Build your website for production.")
    );
    expect(console.log).to.have.been.calledWithExactly(
      formatCommand("npm test", "Run your tests.")
    );
  });
  it("Displays quickstart with yarn", () => {
    displayQuickstart({ useYarn: true }, "");
    expect(console.log).to.have.been.calledWithExactly(
      formatCommand("yarn start", "Start your development server.")
    );
    expect(console.log).to.have.been.calledWithExactly(
      formatCommand("yarn build", "Build your website for production.")
    );
    expect(console.log).to.have.been.calledWithExactly(
      formatCommand("yarn test", "Run your tests.")
    );
  });
  it("Displays quickstart with pnpm", () => {
    displayQuickstart({ usePnpm: true }, "");
    expect(console.log).to.have.been.calledWithExactly(
      formatCommand("pnpm start", "Start your development server.")
    );
    expect(console.log).to.have.been.calledWithExactly(
      formatCommand("pnpm run build", "Build your website for production.")
    );
    expect(console.log).to.have.been.calledWithExactly(
      formatCommand("pnpm test", "Run your tests.")
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
