export default function DownloadButton({ filename }) {
  if (!filename) return null;

  const handleDownload = () => {
    window.open(`https://data-compression-decompression-backend.vercel.app/download/${filename}`, "_blank");
  };

  return (
    <div className="text-center mt-4">
      <button
        onClick={handleDownload}
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        Download Result
      </button>
    </div>
  );
}
