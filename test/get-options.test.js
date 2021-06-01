/* eslint-disable no-console */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const execa = require("execa");
const fse = require("fs-extra");
const tmp = require("tmp");

const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");

chai.use(sinonChai);
const { expect } = chai;

const styles = require("../src/styles.ts");

const {
  projectDirValidator,
  OptionNameError,
  OptionTypeError,
  OptionValueError,
  validateOptions,
  loadFiles,
  overwrittenLater,
} = require("../src/get-options.ts")._testing;

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

describe("loadFiles", () => {
  before(() => {
    sinon.stub(process, "exit");
    sinon.stub(console, "error");
  });
  beforeEach(() => {
    process.exit.reset();
    console.error.reset();
  });
  after(() => {
    console.error.restore();
    process.exit.restore();
  });

  it("Loads no files and returns empty array", () => {
    expect(loadFiles({})).to.eql([]);
  });
  it("Exits with code 1 if file does not exist", () => {
    const tempFile = tmp.fileSync();
    tempFile.removeCallback();
    loadFiles({ load: [tempFile.name] });
    expect(console.error).to.have.been.calledWith(
      styles.fatalError("File does not exist")
    );
    expect(process.exit).to.have.been.calledWith(1);
  });
  it("Exits with code 1 if file is not .js file", () => {
    const tempFile = tmp.dirSync();
    process.chdir(tempFile.name);
    fse.writeFileSync("notajsfile.txt", "");
    loadFiles({ load: ["notajsfile.txt"] });
    expect(console.error).to.have.been.calledWith(
      styles.fatalError("Invalid file type .txt, expected .js")
    );
    expect(process.exit).to.have.been.calledWith(1);
  });
});

describe("overwrittenLater", () => {
  it("Returns true", () => {
    const expected = overwrittenLater(
      "typescript", [{}, { sass: true }, { typescript: true }]
    );
    expect(expected).to.be.true;
  });
  it("Returns false", () => {
    expect(overwrittenLater("typescript", [])).to.be.false;
  });
});
