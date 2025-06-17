import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function CompressionChart({ stats }) {
  if (!stats || !stats.originalSize || !stats.compressedSize) return null;

  const data = {
    labels: ['Original Size', 'Compressed Size'],
    datasets: [
      {
        label: 'File Size (bytes)',
        data: [stats.originalSize, stats.compressedSize],
        backgroundColor: ['#3B82F6', '#10B981'],
      },
    ],
  };

  return (
    <div className="mt-4 p-4 max-w-md mx-auto">
      <Bar data={data} />
    </div>
  );
}
