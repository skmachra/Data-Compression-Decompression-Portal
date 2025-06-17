import { useState } from "react";
import { useDropzone } from "react-dropzone";


export default function UploadForm({ onResponse }) {
  const [file, setFile] = useState(null);
  const [algorithm, setAlgorithm] = useState("rle");

  const handleSubmit = async (e, mode) => {
    e.preventDefault();
    if (!file) return alert("No file selected");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("algorithm", algorithm);

    const endpoint = mode === "compress" ? "compress" : "decompress";
    const res = await fetch(`http://localhost:5000/${endpoint}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      onResponse(data);
    } else {
      alert(data.error || "Something went wrong");
    }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop: (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);
  },
  multiple: false,
});


  const algorithmDescriptions = {
  rle: "RLE compresses consecutive repeated characters (e.g., 'aaa' → '3a').",
  huffman: "Huffman coding assigns shorter binary codes to more frequent characters.",
  lz77: "LZ77 finds and replaces repeated sequences using sliding windows.",
  sharp: "Sharp compresses images using advanced algorithms for better quality. ",
  ffmpeg: "FFmpeg compresses videos using various codecs and settings.",
};

  return (
    <form className="space-y-4 p-4 border rounded shadow w-full max-w-md mx-auto">
      <div
  {...getRootProps()}
  className={`border-2 border-dashed p-6 text-center rounded cursor-pointer ${
    isDragActive ? "bg-green-100 border-green-400" : "bg-gray-50"
  }`}
>
  <input {...getInputProps()} />
  {file ? (
    <p className="text-sm text-gray-800">{file.name}</p>
  ) : (
    <p className="text-sm text-gray-500">
      Drag and drop a file here, or click to select one
    </p>
  )}
</div>

      <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} className="w-full p-2 border">
        <option value="rle">Run-Length Encoding (RLE)</option>
        <option value="huffman">Huffman Coding</option>
        <option value="lz77">LZ77</option>
        <option value="sharp">Image Compression</option>
        <option value="ffmpeg">Video Compression</option>
      </select>
      <p className="text-gray-600 text-xs mt-1">
  {algorithmDescriptions[algorithm]}
</p>

      <div className="flex gap-2">
        <button
          onClick={(e) => handleSubmit(e, "compress")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Compress
        </button>
        <button
          onClick={(e) => handleSubmit(e, "decompress")}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Decompress
        </button>
      </div>
    </form>
  );
}
