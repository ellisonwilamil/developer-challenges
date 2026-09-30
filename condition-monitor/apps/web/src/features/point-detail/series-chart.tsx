import type { ReadingsAnswer } from '@condition-monitor/shared';
import {
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import Box from '@mui/material/Box';
import { Line } from 'react-chartjs-2';

// Only what a line over time needs, so the rest of Chart.js stays out of the bundle.
ChartJS.register(LinearScale, TimeScale, PointElement, LineElement, Tooltip, Legend);

type ChartPoint = { x: number; y: number | null };

/**
 * The points to draw. A bucket becomes two points at its middle, its minimum and its
 * maximum, so the line spans the whole range the readings covered there, peaks
 * included. Where consecutive points are much further apart than usual, a null breaks
 * the line: a gap in the data stays visible instead of being bridged by a straight line.
 */
export function chartPoints(answer: ReadingsAnswer): ChartPoint[] {
  const points: ChartPoint[] = answer.downsampled
    ? answer.buckets.flatMap((bucket) => {
        const middle = (Date.parse(bucket.start) + Date.parse(bucket.end)) / 2;
        return [
          { x: middle, y: bucket.min },
          { x: middle, y: bucket.max },
        ];
      })
    : answer.readings.map((reading) => ({ x: Date.parse(reading.timestamp), y: reading.value }));

  const steps = points
    .slice(1)
    .map((point, index) => point.x - points[index].x)
    .filter((step) => step > 0)
    .sort((a, b) => a - b);
  if (steps.length === 0) return points;
  const usual = steps[Math.floor(steps.length / 2)];

  return points.flatMap((point, index) => {
    const previous = points[index - 1];
    return previous && point.x - previous.x > 3 * usual
      ? [{ x: (previous.x + point.x) / 2, y: null }, point]
      : [point];
  });
}

/** One color per axis, the same in every chart of the page. */
const COLORS: Record<string, string> = {
  H: '#1f77b4',
  V: '#ff7f0e',
  A: '#2ca02c',
  none: '#d62728',
};

export interface ChartSeries {
  label: string;
  axis: string | null;
  answer: ReadingsAnswer;
}

/** A quantity over time, one line per axis, in the browser's local time (ADR 0009). */
export function SeriesChart({
  title,
  unit,
  series,
}: {
  title: string;
  unit: string;
  series: ChartSeries[];
}) {
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    parsing: false,
    normalized: true,
    interaction: { mode: 'nearest', intersect: false },
    scales: {
      x: { type: 'time', time: { tooltipFormat: 'yyyy-MM-dd HH:mm' } },
      y: { title: { display: true, text: unit } },
    },
    elements: { point: { radius: 0 }, line: { borderWidth: 1.5 } },
    plugins: { legend: { position: 'bottom' } },
  };

  return (
    <Box sx={{ position: 'relative', height: 280 }}>
      <Line
        aria-label={`${title} chart, in ${unit}`}
        role="img"
        options={options}
        data={{
          datasets: series.map((item) => ({
            label: item.label,
            data: chartPoints(item.answer),
            borderColor: COLORS[item.axis ?? 'none'],
            backgroundColor: COLORS[item.axis ?? 'none'],
            spanGaps: false,
          })),
        }}
      />
    </Box>
  );
}
