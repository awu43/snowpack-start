const path = require("path");

const fse = require("fs-extra");

const SOURCE_TEMPLATES = require("../src-templates").SOURCE_PATHS;
const DIST_TEMPLATES = require("../src/dist-templates.ts");

for (const template of SOURCE_TEMPLATES.keys()) {
  const srcPackageJson = fse.readFileSync(
    path.join(SOURCE_TEMPLATES.get(template), "package.json"), "utf8"
  );
  fse.writeFileSync(
    path.join(DIST_TEMPLATES.get(template), "package.json"), srcPackageJson
  );
}
