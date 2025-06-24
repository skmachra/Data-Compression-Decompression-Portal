import { useState } from "react";
import { useDropzone } from "react-dropzone";

export default function UploadForm({ onResponse }) {
  const [file, setFile] = useState(null);
  const [algorithm, setAlgorithm] = useState("rle");

  const handleSubmit = async (e, mode) => {
    e.preventDefault();
    if (!file) return alert("❗ No file selected");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("algorithm", algorithm);

    const endpoint = mode === "compress" ? "compress" : "decompress";

    try {
      const res = await fetch(`http://localhost:5000/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        onResponse(data);
      } else {
        // Show specific error from backend
        alert(data.details || data.error || `❌ ${mode}ion failed due to unknown error`);
      }
    } catch (err) {
      alert(`🚫 Network error: ${err.message}`);
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
    rle: `Run-Length Encoding (RLE) is a simple lossless compression method that identifies sequences of repeated characters or bytes and stores them as a single value and count. For example, 'aaaa' becomes '4a'. It's most effective on data with lots of repetition, such as basic images or simple text files.`,

    huffman: `Huffman Coding is a lossless algorithm that builds a binary tree based on the frequency of characters in the input. Characters that appear more frequently are assigned shorter binary codes, while rarer characters get longer codes. This reduces the overall file size without losing any information.`,

    lz77: `LZ77 is a dictionary-based lossless compression algorithm that scans the data for repeated sequences and replaces them with references (distance and length) to earlier occurrences. It uses a sliding window to maintain the context and is effective for compressing data with recurring patterns.`,
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

      <select
        value={algorithm}
        onChange={(e) => setAlgorithm(e.target.value)}
        className="w-full p-2 border"
      >
        <option value="rle">Run-Length Encoding (RLE)</option>
        <option value="huffman">Huffman Coding</option>
        <option value="lz77">LZ77</option>
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
