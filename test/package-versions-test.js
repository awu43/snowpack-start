/* eslint-disable no-undef */
const path = require("path");
const { expect } = require("chai");

const { SOURCE_PATHS } = require("../src-templates");
const SNOWPACK_STARTERS = require("../snowpack-starters");

function getPackageMajorVersions(targetDir) {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const packageJson = require(path.join(targetDir, "package.json"));
  const packageVersions = { dependencies: {}, devDependencies: {} };
  for (const [name, version] of Object.entries(packageJson.dependencies || {})) {
    const majorVersion = version.match(/(\d+)\.\d+\.\d+/)[1];
    packageVersions.dependencies[name] = majorVersion;
  }
  for (const [name, version] of Object.entries(packageJson.devDependencies || {})) {
    const majorVersion = version.match(/(\d+)\.\d+\.\d+/)[1];
    packageVersions.devDependencies[name] = majorVersion;
  }

  if (!Object.keys(packageVersions.dependencies).length) {
    delete packageVersions.dependencies;
  }
  if (!Object.keys(packageVersions.devDependencies).length) {
    delete packageVersions.devDependencies;
  }

  return packageVersions;
}

function testPackageVersionMatch(template) {
  const starterVersions = getPackageMajorVersions(
    SNOWPACK_STARTERS.get(template)
  );
  const srcVersions = getPackageMajorVersions(SOURCE_PATHS.get(template));
  expect(starterVersions).to.eql(srcVersions);
}

describe("testPackageVersionMatch", () => {
  it("Tests blank template", () => {
    const starterVersions = getPackageMajorVersions(
      SNOWPACK_STARTERS.get("blank")
    );
    const srcVersions = getPackageMajorVersions(SOURCE_PATHS.get("blank"));
    delete srcVersions.dependencies;
    expect(starterVersions).to.eql(srcVersions);
  });
  it("Tests blank-typescript template", () => {
    const starterVersions = getPackageMajorVersions(
      SNOWPACK_STARTERS.get("blank-typescript")
    );
    const srcVersions = getPackageMajorVersions(
      SOURCE_PATHS.get("blank-typescript")
    );
    delete srcVersions.dependencies;
    delete srcVersions.devDependencies["@types/canvas-confetti"];
    expect(starterVersions).to.eql(srcVersions);
  });
  it("Tests react template", () => {
    testPackageVersionMatch("react");
  });
  it("Tests react-typescript template", () => {
    testPackageVersionMatch("react-typescript");
  });
  it("Tests vue template", () => {
    testPackageVersionMatch("vue");
  });
  it("Tests vue-typescript template", () => {
    testPackageVersionMatch("vue-typescript");
  });
  it("Tests svelte template", () => {
    testPackageVersionMatch("svelte");
  });
  it("Tests svelte-typescript template", () => {
    testPackageVersionMatch("svelte-typescript");
  });
  it("Tests preact template", () => {
    testPackageVersionMatch("preact");
  });
  it("Tests preact-typescript template", () => {
    testPackageVersionMatch("preact-typescript");
  });
  it("Tests lit-element template", () => {
    testPackageVersionMatch("lit-element");
  });
  it("Tests lit-element-typescript template", () => {
    testPackageVersionMatch("lit-element-typescript");
  });
});
