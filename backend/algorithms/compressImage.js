const sharp = require("sharp");
const path = require("path");

const compressImage = (inputPath) => {
  return new Promise((resolve, reject) => {
    const format = inputPath.endsWith(".png") ? "png" : "jpeg";
    const dir = path.dirname(inputPath);
    const base = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(dir, base + "_temp" + path.extname(inputPath));

    sharp(inputPath)
      .toFormat(format, { quality: 70 })
      .toFile(outputPath, (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve(outputPath); // we return the temp file path
        }
      });
  });
};

module.exports = { compressImage };
