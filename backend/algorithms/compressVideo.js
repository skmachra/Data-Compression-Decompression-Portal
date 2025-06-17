const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const ffmpegPath = require("ffmpeg-static"); // ✅ Import static path

ffmpeg.setFfmpegPath(ffmpegPath); // ✅ Set it for fluent-ffmpeg

const compressVideo = ({ inputPath }) => {
  return new Promise((resolve, reject) => {
    try {
      const ext = path.extname(inputPath); // e.g., .mp4, .mov
      const base = path.basename(inputPath, ext); // file without extension
      const outputPath = path.join(path.dirname(inputPath), `${base}_compressed${ext}`);
      ffmpeg(inputPath)
        .videoBitrate(1024)
        .save(outputPath)
        .on("end", () => resolve(outputPath))
        .on("error", (err) => reject(err));
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = { compressVideo };
