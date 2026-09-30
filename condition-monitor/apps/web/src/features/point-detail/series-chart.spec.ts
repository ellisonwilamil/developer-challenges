import { chartPoints } from './series-chart';

const at = (minute: number) => new Date(Date.UTC(2026, 8, 29, 10, minute)).toISOString();
const ms = (minute: number) => Date.parse(at(minute));

describe('chartPoints', () => {
  it('draws every reading at its instant', () => {
    expect(
      chartPoints({
        downsampled: false,
        readings: [
          { timestamp: at(0), value: 1 },
          { timestamp: at(10), value: 2 },
        ],
      }),
    ).toEqual([
      { x: ms(0), y: 1 },
      { x: ms(10), y: 2 },
    ]);
  });

  it('draws a bucket as its minimum and maximum at its middle, so the peak is drawn', () => {
    expect(
      chartPoints({
        downsampled: true,
        buckets: [{ start: at(0), end: at(20), min: 1, max: 9, count: 3 }],
      }),
    ).toEqual([
      { x: ms(10), y: 1 },
      { x: ms(10), y: 9 },
    ]);
  });

  it('breaks the line where readings stop for much longer than usual', () => {
    const readings = [0, 10, 20, 30, 200, 210].map((minute) => ({
      timestamp: at(minute),
      value: 1,
    }));

    const points = chartPoints({ downsampled: false, readings });

    expect(points.map((point) => point.y)).toEqual([1, 1, 1, 1, null, 1, 1]);
    expect(points[4].x).toBe(ms(115));
  });

  it('keeps a regular series whole, with no break', () => {
    const readings = [0, 10, 20, 35, 45].map((minute) => ({ timestamp: at(minute), value: 1 }));

    expect(chartPoints({ downsampled: false, readings })).toHaveLength(5);
  });
});
