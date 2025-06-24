const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  compressRLE,
  decompressRLE,
  compressRLERaw,
  decompressRLERaw,
} = require("./algorithms/rle");

const {
  compressHuffman,
  decompressHuffman,
  compressHuffmanRaw,
  decompressHuffmanRaw,
} = require("./algorithms/huffman");

const {
  compressLZ77,
  decompressLZ77,
  compressLZ77Raw,
  decompressLZ77Raw,
} = require("./algorithms/lz77");

const app = express();
const PORT = 5000;

// ✅ Vercel-compatible upload path
const uploadDir = "/tmp/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

// 📁 Upload storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Route: Basic check
app.get("/", (req, res) => {
  res.send("Compression server is running");
});

// ✅ Route: Upload check
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  res.json({
    message: "File uploaded successfully",
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

// ✅ Route: Compress
app.post("/compress", upload.single("file"), async (req, res) => {
  const algorithm = req.body.algorithm;
  const file = req.file;

  if (!file || !algorithm) {
    return res.status(400).json({ error: "❗ File or algorithm not provided" });
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const base = path.basename(file.originalname, ext);
  const inputPath = path.join(uploadDir, file.filename);
  const outputPath = path.join(uploadDir, `compressed-${base}${ext}`);

  try {
    const isText = [".txt", ".json", ".csv", ".xml", ".bin"].includes(ext);
    const isImage = [".png", ".jpg", ".jpeg", ".bmp", ".gif"].includes(ext);
    if (!isText && !isImage) {
      return res
        .status(400)
        .json({ error: "❌ Unsupported file type for compression" });
    }

    let stats = {
      originalSize: fs.statSync(inputPath).size,
      compressedSize: 0,
    };
    const startTime = Date.now();

    if (isText) {
      if (algorithm === "rle") compressRLE(inputPath, outputPath);
      else if (algorithm === "huffman") compressHuffman(inputPath, outputPath);
      else if (algorithm === "lz77") compressLZ77(inputPath, outputPath);
      else
        return res
          .status(400)
          .json({ error: "❌ Unsupported algorithm for text file" });
    } else if (isImage) {
      if (algorithm === "rle") compressRLERaw(inputPath, outputPath);
      else if (algorithm === "huffman")
        compressHuffmanRaw(inputPath, outputPath);
      else if (algorithm === "lz77") compressLZ77Raw(inputPath, outputPath);
      else
        return res
          .status(400)
          .json({ error: "❌ Unsupported algorithm for image file" });
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(3);

    if (!fs.existsSync(outputPath)) {
      return res
        .status(500)
        .json({ error: "❌ Compression failed: No output file generated" });
    }

    stats.compressedSize = fs.statSync(outputPath).size;

    res.json({
      message: `✅ File compressed using ${algorithm}`,
      algorithm,
      originalSize: stats.originalSize,
      compressedSize: stats.compressedSize,
      compressionRatio: (stats.compressedSize / stats.originalSize).toFixed(2),
      processingTime,
      outputFilename: `compressed-${base}${ext}`,
    });
  } catch (err) {
    console.error("❌ Compression error:", err);
    res.status(500).json({
      error: "❌ Compression failed (internal server error)",
      details: err.message,
    });
  }
});

// ✅ Route: Decompress
app.post("/decompress", upload.single("file"), (req, res) => {
  const algorithm = req.body.algorithm;
  const file = req.file;

  if (!file || !algorithm) {
    return res.status(400).json({ error: "❗ File or algorithm not provided" });
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const inputPath = path.join(uploadDir, file.filename);
  const outputFilename = "decompressed-" + file.originalname;
  const outputPath = path.join(uploadDir, outputFilename);

  try {
    let stats;
    const isImage = [".png", ".jpg", ".jpeg", ".bmp", ".gif"].includes(ext);
    const isText = [".txt", ".json", ".csv", ".xml", ".bin"].includes(ext);
    if (!isText && !isImage) {
      return res
        .status(400)
        .json({ error: "❌ Unsupported file type for decompression" });
    }

    const startTime = Date.now();
    if (algorithm === "rle") {
      stats = isImage
        ? decompressRLERaw(inputPath, outputPath)
        : decompressRLE(inputPath, outputPath);
    } else if (algorithm === "huffman") {
      stats = isImage
        ? decompressHuffmanRaw(inputPath, outputPath)
        : decompressHuffman(inputPath, outputPath);
    } else if (algorithm === "lz77") {
      stats = isImage
        ? decompressLZ77Raw(inputPath, outputPath)
        : decompressLZ77(inputPath, outputPath);
    } else {
      return res
        .status(400)
        .json({ error: `❌ Unsupported algorithm '${algorithm}'` });
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(3);
    if (!stats || !stats.decompressedSize) {
      return res
        .status(500)
        .json({ error: "❌ Decompression failed or invalid file format" });
    }

    res.json({
      message: `✅ File decompressed with ${algorithm}`,
      algorithm,
      fileType: isImage ? "image" : "text",
      compressedSize: file.size,
      decompressedSize: stats.decompressedSize,
      decompressionRatio: (file.size / stats.decompressedSize).toFixed(2),
      processingTime,
      outputFilename,
    });
  } catch (err) {
    console.error("❌ Decompression error:", err);
    res.status(500).json({
      error: "❌ Decompression failed (internal server error)",
      details: err.message,
    });
  }
});

// ✅ Route: Download (optional for dev use only — not ideal on Vercel)
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).send("Error during file download");
      }
    });
  } else {
    res.status(404).send("File not found");
  }
});

// ✅ Auto cleanup: optional on Vercel (won't persist anyway)
const CLEANUP_INTERVAL = 10 * 60 * 1000; // every 10 min
const MAX_FILE_AGE = 30 * 60 * 1000; // 30 min old

function cleanupUploads() {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return console.error("Cleanup error:", err);
    files.forEach((file) => {
      const fullPath = path.join(uploadDir, file);
      fs.stat(fullPath, (err, stats) => {
        if (err) return;
        if (Date.now() - stats.mtimeMs > MAX_FILE_AGE) {
          fs.unlink(fullPath, () => {});
        }
      });
    });
  });
}
setInterval(cleanupUploads, CLEANUP_INTERVAL);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
