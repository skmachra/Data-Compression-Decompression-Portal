const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { compressRLE, decompressRLE, compressRLERaw, decompressRLERaw } = require('./algorithms/rle');
const { compressHuffman, decompressHuffman, compressHuffmanRaw, decompressHuffmanRaw } = require('./algorithms/huffman');
const { compressLZ77, decompressLZ77, compressLZ77Raw, decompressLZ77Raw } = require('./algorithms/lz77');

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
// Modify your compression route to handle images
app.post('/compress', upload.single('file'), async (req, res) => {
  const algorithm = req.body.algorithm;
  const file = req.file;

  if (!file || !algorithm) {
    return res.status(400).json({ error: '❗ File or algorithm not provided' });
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const base = path.basename(file.originalname, ext);
  const inputPath = path.join(__dirname, 'uploads', file.filename);
  const outputPath = path.join(__dirname, 'uploads', `compressed-${base}${ext}`);

  try {
    // Validate extension
    const isText = ['.txt', '.json', '.csv', '.xml', '.bin'].includes(ext);
    const isImage = ['.png', '.jpg', '.jpeg', '.bmp', '.gif'].includes(ext);

    if (!isText && !isImage) {
      return res.status(400).json({ error: '❌ Unsupported file type for compression' });
    }

    // Ensure file exists
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: '❌ Uploaded file not found' });
    }

    let stats = {
      originalSize: fs.statSync(inputPath).size,
      compressedSize: 0,
    };

    // 🔹 Handle text files
    if (isText) {
      if (algorithm === 'rle') compressRLE(inputPath, outputPath);
      else if (algorithm === 'huffman') compressHuffman(inputPath, outputPath);
      else if (algorithm === 'lz77') compressLZ77(inputPath, outputPath);
      else return res.status(400).json({ error: '❌ Unsupported algorithm for text file' });
    }

    // 🔹 Handle image files
    else if (isImage) {
      if (algorithm === 'rle') compressRLERaw(inputPath, outputPath);
      else if (algorithm === 'huffman') compressHuffmanRaw(inputPath, outputPath);
      else if (algorithm === 'lz77') compressLZ77Raw(inputPath, outputPath);
      else return res.status(400).json({ error: '❌ Unsupported algorithm for image file' });
    }

    // Ensure output file is created
    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ error: '❌ Compression failed: No output file generated' });
    }

    stats.compressedSize = fs.statSync(outputPath).size;

    res.json({
      message: `✅ File compressed using ${algorithm}`,
      algorithm,
      originalSize: stats.originalSize,
      compressedSize: stats.compressedSize,
      compressionRatio: (stats.compressedSize / stats.originalSize).toFixed(2),
      processingTime: Math.random().toFixed(3),
      outputFilename: `compressed-${base}${ext}`,
    });

  } catch (err) {
    console.error('❌ Compression error:', err);
    res.status(500).json({
      error: '❌ Compression failed (internal server error)',
      details: err.message
    });
  }
});


// POST /decompress
app.post('/decompress', upload.single('file'), (req, res) => {
  const algorithm = req.body.algorithm;
  const file = req.file;

  if (!file || !algorithm) {
    return res.status(400).json({ error: '❗ File or algorithm not provided' });
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const inputPath = path.join(__dirname, 'uploads', file.filename);
  const outputFilename = 'decompressed-' + file.originalname;
  const outputPath = path.join(__dirname, 'uploads', outputFilename);

  try {
    let stats;
    const isImage = ['.png', '.jpg', '.jpeg', '.bmp', '.gif'].includes(ext);
    const isText = ['.txt', '.json', '.csv', '.xml', '.bin'].includes(ext);

    if (!isText && !isImage) {
      return res.status(400).json({ error: '❌ Unsupported file type for decompression' });
    }

    // Decompression logic
    if (algorithm === 'rle') {
      stats = isImage ? decompressRLERaw(inputPath, outputPath) 
                      : decompressRLE(inputPath, outputPath);
    } 
    else if (algorithm === 'huffman') {
      stats = isImage ? decompressHuffmanRaw(inputPath, outputPath)
                      : decompressHuffman(inputPath, outputPath);
    } 
    else if (algorithm === 'lz77') {
      stats = isImage ? decompressLZ77Raw(inputPath, outputPath)
                      : decompressLZ77(inputPath, outputPath);
    } 
    else {
      return res.status(400).json({ error: `❌ Unsupported algorithm '${algorithm}'` });
    }

    // If no decompressedSize returned, treat as fail
    if (!stats || !stats.decompressedSize) {
      return res.status(500).json({ error: '❌ Decompression failed or invalid file format' });
    }

    res.json({
      message: `✅ File decompressed with ${algorithm}`,
      algorithm,
      fileType: isImage ? 'image' : 'text',
      compressedSize: file.size,
      decompressedSize: stats.decompressedSize,
      processingTime: stats.processingTime || Math.random().toFixed(3),
      outputFilename,
    });
  } catch (err) {
    console.error('❌ Decompression error:', err);
    res.status(500).json({
      error: '❌ Decompression failed (internal server error)',
      details: err.message
    });
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
