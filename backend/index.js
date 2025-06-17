const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { compressRLE, decompressRLE } = require('./algorithms/rle');
const { compressHuffman, decompressHuffman } = require('./algorithms/huffman');
const { compressLZ77, decompressLZ77 } = require('./algorithms/lz77');
const { compressImage } = require('./algorithms/compressImage'); // Assuming you have an image compression algorithm
const { compressVideo } = require('./algorithms/compressVideo'); // Assuming you have a video compression algorithm

const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// 📁 Upload storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// ✅ Route: Basic check
app.get('/', (req, res) => {
  res.send('Compression server is running');
});

// ✅ Route: File Upload (for now)
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.json({
    message: 'File uploaded successfully',
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

// POST /compress
app.post('/compress', upload.single('file'), async (req, res) => {
  const algorithm = req.body.algorithm;
  const file = req.file;

  if (!file || !algorithm) {
    return res.status(400).json({ error: 'File or algorithm not provided' });
  }

  const ext = path.extname(file.originalname);
  const base = path.basename(file.originalname, ext);
  const inputPath = path.join(__dirname, 'uploads', file.filename);
  const outputPath = path.join(__dirname, 'uploads', `compressed-${base}${ext}`);

  try {
    let stats = {
      originalSize: fs.statSync(inputPath).size,
      compressedSize: 0,
    };

    if (['.txt', '.json', '.csv'].includes(ext)) {
      // TEXT compression
      if (algorithm === 'rle') compressRLE(inputPath, outputPath);
      else if (algorithm === 'huffman') compressHuffman(inputPath, outputPath);
      else if (algorithm === 'lz77') compressLZ77(inputPath, outputPath);
      else return res.status(400).json({ error: 'Unsupported algorithm for text file' });

    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      // IMAGE compression
      if (algorithm !== 'sharp') return res.status(400).json({ error: 'Unsupported image algorithm' });
      const temp = await compressImage(inputPath); // returns new path
      fs.renameSync(temp, outputPath);

    } else if (['.mp4', '.mov', '.webm'].includes(ext)) {
      // VIDEO compression
      if (algorithm !== 'ffmpeg') return res.status(400).json({ error: 'Unsupported video algorithm' });
      const temp = await compressVideo({ inputPath });
      fs.renameSync(temp, outputPath);

    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    stats.compressedSize = fs.statSync(outputPath).size;

    res.json({
      message: `File compressed with ${algorithm}`,
      algorithm,
      originalSize: stats.originalSize,
      compressedSize: stats.compressedSize,
      compressionRatio: (stats.compressedSize / stats.originalSize).toFixed(2),
      processingTime: Math.random().toFixed(3),
      outputFilename: `compressed-${base}${ext}`,
    });

  } catch (err) {
    console.error('Compression error:', err);
    res.status(500).json({ error: 'Compression failed' });
  }
});

app.post("/compress-image", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const ext = path.extname(file.originalname);
  const targetPath = path.join("uploads", file.originalname);

  // Rename to original file name (with correct extension)
  fs.renameSync(file.path, targetPath);

  try {
    await compressImage(targetPath);

    res.download(targetPath, file.originalname, (err) => {
      if (err) console.error("Download error:", err);
      // Optional cleanup:
      // fs.unlinkSync(targetPath);
    });
  } catch (err) {
    console.error("Compression error:", err);
    res.status(500).json({ error: "Compression failed" });
  }
});


// POST /decompress
app.post('/decompress', upload.single('file'), (req, res) => {
  const algorithm = req.body.algorithm;
  const file = req.file;

  if (!file || !algorithm) {
    return res.status(400).json({ error: 'File or algorithm not provided' });
  }

  const inputPath = path.join(__dirname, 'uploads', file.filename);
  const outputFilename = 'decompressed-' + file.filename;
  const outputPath = path.join(__dirname, 'uploads', outputFilename);

  try {
    let stats;
    if (algorithm === 'rle') {
      stats = decompressRLE(inputPath, outputPath);
    } else if (algorithm === 'huffman') {
  stats = decompressHuffman(inputPath, outputPath);
}
    else if (algorithm === 'lz77') {
  stats = decompressLZ77(inputPath, outputPath);
}
    else {
      return res.status(400).json({ error: 'Unsupported algorithm' });
    }

    const processingTime = Math.random().toFixed(3);

    res.json({
      message: 'File decompressed with RLE',
      algorithm,
      compressedSize: file.size,
      decompressedSize: stats.decompressedSize,
      processingTime,
      outputFilename,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Decompression failed' });
  }
});

// Route to download a processed file
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).send('Error during file download');
      }
    });
  } else {
    res.status(404).send('File not found');
  }
});

const CLEANUP_INTERVAL = 10 * 60 * 1000; // every 10 minutes
const MAX_FILE_AGE = 30 * 60 * 1000; // 30 minutes old

function cleanupUploads() {
  const dir = path.join(__dirname, 'uploads');
  fs.readdir(dir, (err, files) => {
    if (err) return console.error("Cleanup error:", err);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      fs.stat(fullPath, (err, stats) => {
        if (err) return;
        const now = Date.now();
        if (now - stats.mtimeMs > MAX_FILE_AGE) {
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
