/* eslint-disable no-console */
const path = require("path");
const execa = require("execa");
const fse = require("fs-extra");

const { installPackages } = require("../src/index.js")._testing;
const { SOURCE_CONFIGS } = require("../src-templates");

function createSnowpackApps() {
  if (fse.pathExistsSync("created-snowpack-apps")) {
    console.log("Delete the existing created-snowpack-apps folder before creating a new one");
    return;
  }

  fse.mkdirSync("created-snowpack-apps");
  fse.copyFileSync("dist-templates/index.js", "created-snowpack-apps/index.js");
  try {
    execa.sync("python test/create_snowpack_apps.py", { stdio: "inherit" });
  } catch (error) {
    for (const template of SOURCE_CONFIGS.keys()) {
      const args = [
        `created-snowpack-apps/${template}`,
        `--template @snowpack/app-template-${template}`,
        "--no-install",
      ];
      execa.sync("npx create-snowpack-app", args, { stdio: "inherit" });
    }
  }
  for (const template of SOURCE_CONFIGS.keys()) {
    fse.rmdirSync(
      path.join("created-snowpack-apps", template, ".git"), { recursive: true }
    );
  }
}

function createSnowpackStarters() {
  if (fse.pathExistsSync("snowpack-starters")) {
    console.log("Delete the existing snowpack-starters folder before creating a new one");
    return;
  }

  fse.mkdirSync("snowpack-starters");
  fse.copyFileSync("dist-templates/index.js", "snowpack-starters/index.js");
  try {
    execa.sync("python test/create_snowpack_starters.py");
  } catch (error) {
    process.chdir("snowpack-starters");
    for (const [template, config] of SOURCE_CONFIGS.entries()) {
      fse.mkdirSync(template);
      process.chdir(template);
      fse.writeFileSync("package.json", JSON.stringify({}, null, 2), "utf8");
      installPackages(config);
      process.chdir("..");
    }
  }
}

function main() {
  createSnowpackApps();
  createSnowpackStarters();
}

if (require.main === module) {
  main();
}
