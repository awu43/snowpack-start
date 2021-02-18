/* eslint-disable no-undef */

const { SOURCE_PATHS } = require("../src-templates");
const CREATED_SNOWPACK_APPS = require("../created-snowpack-apps");

const {
  testDirectoryContentsEqual,
} = require("./test-utils.js");

function testSrcTemplateMatch(template) {
  testDirectoryContentsEqual(
    SOURCE_PATHS.get(template), CREATED_SNOWPACK_APPS.get(template)
  );
}

describe("testSrcTemplateMatch", () => {
  it("Tests blank template", () => {
    testSrcTemplateMatch("blank");
  });
  it("Tests blank-typescript template", () => {
    testSrcTemplateMatch("blank-typescript");
  });
  it("Tests react template", () => {
    testSrcTemplateMatch("react");
  });
  it("Tests react-typescript template", () => {
    testSrcTemplateMatch("react-typescript");
  });
  it("Tests vue template", () => {
    testSrcTemplateMatch("vue");
  });
  it("Tests vue-typescript template", () => {
    testSrcTemplateMatch("vue-typescript");
  });
  it("Tests svelte template", () => {
    testSrcTemplateMatch("svelte");
  });
  it("Tests svelte-typescript template", () => {
    testSrcTemplateMatch("svelte-typescript");
  });
  it("Tests preact template", () => {
    testSrcTemplateMatch("preact");
  });
  it("Tests preact-typescript template", () => {
    testSrcTemplateMatch("preact-typescript");
  });
  it("Tests lit-element template", () => {
    testSrcTemplateMatch("lit-element");
  });
  it("Tests lit-element-typescript template", () => {
    testSrcTemplateMatch("lit-element-typescript");
  });
});
