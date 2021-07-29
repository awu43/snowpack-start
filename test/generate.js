const execa = require("execa");
const fse = require("fs-extra");

const { installPackages } = require("../dist/index")._testing;
const { SOURCE_CONFIGS } = require("../src-templates");

function createSnowpackApps() {
  console.log("Creating Snowpack apps\n");
  if (!fse.existsSync("created-snowpack-apps")) {
    fse.mkdirSync("created-snowpack-apps");
    fse.copyFileSync("dist-templates/index.js", "created-snowpack-apps/index.js");
  }

  try {
    execa.sync("python test/create_snowpack_apps.py", { stdio: "inherit" });
  } catch (error) {
    for (const template of SOURCE_CONFIGS.keys()) {
      const folder = `created-snowpack-apps/${template}`;
      if (fse.existsSync(folder)) {
        console.log(`Snowpack app template ${template} already exists.`);
      } else {
        const args = [
          "npx",
          `create-snowpack-app created-snowpack-apps/${template}`,
          `--template @snowpack/app-template-${template}`,
          "--no-install",
          "--no-git",
        ];
        execa.commandSync(args.join(" "));
        console.log(`Created Snowpack app template ${template}.`);
      }
    }
  }
}

function createSnowpackStarters() {
  console.log("\nCreating Snowpack starters\n");
  if (!fse.existsSync("snowpack-starters")) {
    fse.mkdirSync("snowpack-starters");
    fse.copyFileSync("dist-templates/index.js", "snowpack-starters/index.js");
  }

  try {
    execa.sync("python test/create_snowpack_starters.py", { stdio: "inherit" });
  } catch (error) {
    process.chdir("snowpack-starters");
    for (const [template, config] of SOURCE_CONFIGS.entries()) {
      if (fse.existsSync(template)) {
        console.log(`Snowpack starter template ${template} already exists.`);
      } else {
        fse.mkdirSync(template);
        process.chdir(template);
        fse.writeFileSync("package.json", JSON.stringify({}, null, 2), "utf8");
        installPackages(config);
        process.chdir("..");
        console.log(`Created Snowpack starter template ${template}.`);
      }
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
