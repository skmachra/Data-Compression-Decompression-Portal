# 📦 Data Compression & Decompression Portal

A full-stack web application that allows users to upload files and compress them using various algorithms including:
- Huffman Coding
- Run-Length Encoding (RLE)
- LZ77
- Image compression using Sharp
- Video compression using FFmpeg

---

## 🚀 Features

- 📁 File Upload (Text, Image, Video)
- 🔄 Compress/Decompress using multiple algorithms
- 📉 View compression ratio and file size stats
- 💾 Download compressed files
- 📚 Explanation of each compression algorithm
- 📱 Responsive frontend using React + Tailwind CSS

---

## 🛠️ Tech Stack

### Frontend
- React
- Tailwind CSS
- Axios (for API calls)

### Backend
- Node.js
- Express.js
- Multer (for file upload)
- fs (for file handling)
- `fluent-ffmpeg` + `ffmpeg-static` (video compression)
- Sharp (image compression)
- Custom implementations for Huffman, RLE, and LZ77

---

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/data-compression-portal.git
cd data-compression-portal
```

## 2. Backend Setup

```bash
cd backend
npm install
```

Start the backend:
```bash
node index.js
```
### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

###  📌 Usage
Upload any supported file (.txt, .jpg/.png, .mp4).

Select a compression algorithm.

Click "Compress".

Download the processed file and view compression stats.

## 🧪 Supported Algorithms

| Algorithm | File Types     | Notes                     |
|-----------|----------------|---------------------------|
| Huffman   | `.txt`, `.jpg` | Lossless                  |
| RLE       | `.txt`, `.bmp` | Best for repeating data   |
| LZ77      | `.txt`         | Sliding window compression|
| Sharp     | `.png`, `.jpeg`| Image quality reduction   |
| FFmpeg    | `.mp4`         | Video bitrate reduction   |
