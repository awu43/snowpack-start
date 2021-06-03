const fs = require("fs");

function fileReadAndReplace(file, targetStr, replStr) {
  fs.writeFileSync(
    file, fs.readFileSync(file, "utf8").replace(targetStr, replStr), "utf8"
  );
}

fileReadAndReplace("dist/get-options.js", "defaults.ts", "defaults.js");
