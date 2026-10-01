import {
  backtest,
  fit,
  leastSquares,
  predict,
  quantile,
  sameHourYesterday,
} from './autoregression';

/** A daily cycle around a level, with an optional rise per hour and a fixed "noise". */
function series(hours: number, { rise = 0, noise = 0 } = {}): number[] {
  return Array.from({ length: hours }, (_, hour) => {
    // A deterministic stand-in for noise: no test depends on a random draw.
    const jitter = noise * Math.sin(hour * 12.9898) * Math.cos(hour * 78.233);
    return 10 + 2 * Math.sin((2 * Math.PI * hour) / 24) + rise * hour + jitter;
  });
}

const maxError = (a: number[], b: number[]) =>
  Math.max(...a.map((value, i) => Math.abs(value - b[i])));

describe('leastSquares', () => {
  it('recovers the weights of an exact linear relation', () => {
    const rows = [
      [1, 2, 1],
      [2, 1, 1],
      [3, 5, 1],
      [4, 2, 1],
      [0, 7, 1],
    ];
    const targets = rows.map(([a, b]) => 2 * a - b + 3);

    const [a, b, constant] = leastSquares(rows, targets);

    expect(a).toBeCloseTo(2, 5);
    expect(b).toBeCloseTo(-1, 5);
    expect(constant).toBeCloseTo(3, 5);
  });
});

describe('fit and predict', () => {
  it('continues a daily cycle a whole day ahead', () => {
    const all = series(10 * 24 + 24);
    const history = all.slice(0, 10 * 24);

    const predicted = predict(fit(history, 48), history, 24);

    expect(maxError(predicted, all.slice(10 * 24))).toBeLessThan(0.01);
  });

  it('continues a steady rise on top of the cycle', () => {
    const all = series(10 * 24 + 24, { rise: 0.02 });
    const history = all.slice(0, 10 * 24);

    const predicted = predict(fit(history, 48), history, 24);

    expect(maxError(predicted, all.slice(10 * 24))).toBeLessThan(0.05);
  });

  it('predicts a constant series as constant', () => {
    const history = Array(200).fill(7);

    expect(maxError(predict(fit(history, 48), history, 24), Array(24).fill(7))).toBeLessThan(1e-3);
  });
});

describe('sameHourYesterday', () => {
  it('repeats the last 24 values, in order', () => {
    const history = Array.from({ length: 48 }, (_, hour) => hour);

    expect(sameHourYesterday(history, 24)).toEqual(history.slice(24));
  });
});

describe('quantile', () => {
  it('answers the value that the share of the numbers stays within', () => {
    const numbers = [5, 1, 4, 2, 3, 10, 9, 8, 7, 6];

    expect(quantile(numbers, 0.9)).toBe(9);
    expect(quantile(numbers, 1)).toBe(10);
    expect(quantile([3], 0.9)).toBe(3);
  });
});

describe('backtest', () => {
  const options = { window: 48, horizon: 24, trainShare: 0.8, coverage: 0.9 };

  it('judges the model on the last fifth, one forecast per hour that leaves room for a day', () => {
    const values = series(7 * 24, { noise: 0.3 });

    const judged = backtest(values, options);

    // 168 hours: fitted on 134, and 11 origins leave 24 hours ahead of them.
    expect(judged?.forecasts).toBe(11);
    expect(judged?.band).toHaveLength(24);
    expect(judged?.band.every((width) => width >= 0)).toBe(true);
  });

  it('beats "same hour yesterday" on a noisy cycle that rises', () => {
    const judged = backtest(series(30 * 24, { rise: 0.01, noise: 0.3 }), options);

    expect(judged?.error).toBeLessThan(judged?.baselineError as number);
  });

  it('answers null when the rest of the history is shorter than one forecast', () => {
    expect(backtest(series(100), options)).toBeNull();
  });
});
