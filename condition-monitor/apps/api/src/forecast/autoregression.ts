/**
 * A linear autoregression: each value is a weighted sum of the values before it, plus a
 * constant. The weights come from least squares, a closed formula, so the same history
 * always gives the same model, with no training to run (docs/forecast-study.md).
 */

/** Solves min |Xb - y| by the normal equations, with Gauss-Jordan elimination. */
export function leastSquares(rows: number[][], targets: number[]): number[] {
  const size = rows[0].length;
  const system = Array.from({ length: size }, () => new Float64Array(size + 1));
  rows.forEach((row, index) => {
    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j < size; j += 1) system[i][j] += row[i] * row[j];
      system[i][size] += row[i] * targets[index];
    }
  });
  // A whisker of ridge keeps nearly dependent columns solvable: neighbouring hours are
  // close to each other, and a constant series makes every lag the same column.
  const diagonal = system.reduce((sum, row, index) => sum + row[index], 0) / size;
  const ridge = 1e-9 * (diagonal || 1);
  for (let i = 0; i < size; i += 1) system[i][i] += ridge;

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(system[row][column]) > Math.abs(system[pivot][column])) pivot = row;
    }
    [system[column], system[pivot]] = [system[pivot], system[column]];
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = system[row][column] / system[column][column];
      for (let k = column; k <= size; k += 1) system[row][k] -= factor * system[column][k];
    }
  }
  return system.map((row, index) => row[size] / row[index]);
}

/** The weights of the last `window` values, oldest first, then the constant. */
export type Model = number[];

export function fit(history: number[], window: number): Model {
  const rows: number[][] = [];
  const targets: number[] = [];
  for (let index = window; index < history.length; index += 1) {
    rows.push([...history.slice(index - window, index), 1]);
    targets.push(history[index]);
  }
  return leastSquares(rows, targets);
}

/**
 * The next `horizon` values after the history. Each prediction joins the history of the
 * next one: beyond the first step the model feeds on its own output, so errors add up,
 * which is why the forecast comes with a band.
 */
export function predict(model: Model, history: number[], horizon: number): number[] {
  const window = model.length - 1;
  const series = history.slice(-window);
  for (let step = 0; step < horizon; step += 1) {
    const recent = series.slice(-window);
    series.push(recent.reduce((sum, value, index) => sum + value * model[index], model[window]));
  }
  return series.slice(-horizon);
}

/** Each hour as it was 24 hours before: the baseline a daily cycle makes hard to beat. */
export function sameHourYesterday(history: number[], horizon: number): number[] {
  return Array.from({ length: horizon }, (_, step) => history[history.length - 24 + (step % 24)]);
}

export interface Backtest {
  /** Forecasts made, one per origin. */
  forecasts: number;
  /** Mean absolute error of the model and of the baseline, over every hour ahead. */
  error: number;
  baselineError: number;
  /** For each hour ahead, the absolute error that `coverage` of the forecasts stayed within. */
  band: number[];
}

/**
 * Judges the model on the part of the history it was not fitted on. The first
 * `trainShare` of the values fits a model; from every hour after that, it predicts the
 * next `horizon` hours seeing only what came before, and each prediction is compared
 * with what happened. Null when the rest is too short for a single forecast.
 */
export function backtest(
  values: number[],
  options: { window: number; horizon: number; trainShare: number; coverage: number },
): Backtest | null {
  const { window, horizon } = options;
  const split = Math.floor(values.length * options.trainShare);
  if (split <= window || split + horizon > values.length) return null;

  const model = fit(values.slice(0, split), window);
  const errorsAt: number[][] = Array.from({ length: horizon }, () => []);
  let baselineSum = 0;
  let forecasts = 0;
  for (let origin = split; origin + horizon <= values.length; origin += 1) {
    const history = values.slice(0, origin);
    const predicted = predict(model, history, horizon);
    const baseline = sameHourYesterday(history, horizon);
    for (let step = 0; step < horizon; step += 1) {
      const actual = values[origin + step];
      errorsAt[step].push(Math.abs(predicted[step] - actual));
      baselineSum += Math.abs(baseline[step] - actual);
    }
    forecasts += 1;
  }
  const count = forecasts * horizon;
  return {
    forecasts,
    error: errorsAt.reduce((sum, errors) => sum + errors.reduce((a, b) => a + b, 0), 0) / count,
    baselineError: baselineSum / count,
    band: errorsAt.map((errors) => quantile(errors, options.coverage)),
  };
}

/** The value below which the given share of the numbers falls. */
export function quantile(numbers: number[], share: number): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(share * sorted.length) - 1)];
}
