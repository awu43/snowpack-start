const fs = require("fs");

function fileReadAndReplace(file, targetStr, replStr) {
  fs.writeFileSync(
    file, fs.readFileSync(file, "utf8").replace(targetStr, replStr), "utf8"
  );
}

fileReadAndReplace(
  "dist/get-options.js", /(require\(".+?\.)ts("\))/g, "$1js$2"
);
fileReadAndReplace("dist/index.js", /(require\(".+?\.)ts("\))/g, "$1js$2");
