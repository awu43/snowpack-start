const execa = require("execa");
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
  addDeps,
} = require("../src/get-options.ts")._testing;

describe("validateOptions", () => {
  before(() => {
    sinon.stub(execa, "commandSync");
  });
  beforeEach(() => {
    execa.commandSync.resetHistory();
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
  it("Throws Error if otherProdDeps contains a non-string", () => {
    const invalidOptions = { otherProdDeps: [null] };
    expect(() => validateOptions(invalidOptions))
      .to.throw(styles.errorMsg("otherProdDeps must be an array of strings"));
  });
  it("Throws Error if otherDevDeps contains a non-string", () => {
    const invalidOptions = { otherDevDeps: [null] };
    expect(() => validateOptions(invalidOptions))
      .to.throw(styles.errorMsg("otherDevDeps must be an array of strings"));
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
    process.exit.resetHistory();
    console.error.resetHistory();
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
});

describe("overwrittenLater", () => {
  it("Returns true if otherProdDeps is cleared", () => {
    const expected = overwrittenLater(
      "otherProdDeps", [{ otherProdDeps: ["none", "foo"] }]
    );
    expect(expected).to.be.true;
  });
  it("Returns false if otherProdDeps is not cleared", () => {
    const expected = overwrittenLater(
      "otherProdDeps", [{ otherProdDeps: ["bar"] }]
    );
    expect(expected).to.be.false;
  });
  it("Returns true if otherDevDeps is cleared", () => {
    const expected = overwrittenLater(
      "otherDevDeps", [{ otherDevDeps: ["none", "foo"] }]
    );
    expect(expected).to.be.true;
  });
  it("Returns false if otherDevDeps is not cleared", () => {
    const expected = overwrittenLater(
      "otherDevDeps", [{ otherDevDeps: ["bar"] }]
    );
    expect(expected).to.be.false;
  });
  it("Returns true if a non-additive option is overwritten", () => {
    const expected = overwrittenLater(
      "typescript", [{}, { sass: true }, { typescript: true }]
    );
    expect(expected).to.be.true;
  });
  it("Returns false if a non-additive option is not overwritten", () => {
    expect(overwrittenLater("typescript", [{ sass: true }])).to.be.false;
  });
});

describe("addDeps", () => {
  it("Adds dependencies", () => {
    const deplist = ["foo"];
    addDeps(deplist, ["bar"]);
    expect(deplist).to.eql(["foo", "bar"]);
  });
  it("Clears prior dependencies", () => {
    const deplist = ["foo"];
    addDeps(deplist, ["none", "bar"]);
    expect(deplist).to.eql(["bar"]);
  });
  it("Does not add duplicate dependencies", () => {
    const deplist = ["foo"];
    addDeps(deplist, ["bar", "foo", "baz"]);
    expect(deplist).to.eql(["foo", "bar", "baz"]);
  });
});
