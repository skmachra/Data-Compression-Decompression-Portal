import { useState } from "react";
import UploadForm from "./components/UploadForm";
import FileStats from "./components/FileStats";
import DownloadButton from "./components/DownloadButton";
import CompressionChart from "./components/CompressionChart";


function App() {
  const [result, setResult] = useState(null);

  return (
    <div className="min-h-screen bg-white py-10 px-4">
      <h1 className="text-2xl font-bold text-center mb-6">🗜️ Compression & Decompression Portal</h1>
      <UploadForm onResponse={setResult} />
      <FileStats stats={result} />
      <DownloadButton filename={result?.outputFilename} />
      <CompressionChart stats={result} />

    </div>
  );
}

export default App;
