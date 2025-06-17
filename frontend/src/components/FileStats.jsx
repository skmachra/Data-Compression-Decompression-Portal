export default function FileStats({ stats }) {
  if (!stats) return null;

  return (
    <div className="mt-4 p-4 border rounded shadow bg-gray-50 text-sm max-w-md mx-auto">
      <p><strong>Algorithm:</strong> {stats.algorithm}</p>
      {stats.originalSize && <p><strong>Original Size:</strong> {stats.originalSize} bytes</p>}
      {stats.compressedSize && <p><strong>Compressed Size:</strong> {stats.compressedSize} bytes</p>}
      {stats.decompressedSize && <p><strong>Decompressed Size:</strong> {stats.decompressedSize} bytes</p>}
      {stats.compressionRatio && <p><strong>Compression Ratio:</strong> {stats.compressionRatio}</p>}
      <p><strong>Processing Time:</strong> {stats.processingTime} sec</p>
    </div>
  );
}
