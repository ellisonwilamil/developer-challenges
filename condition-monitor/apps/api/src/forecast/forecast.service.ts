import { Injectable } from '@nestjs/common';
import { FORECAST, quantityMapping, type Forecast } from '@condition-monitor/shared';
import { notFound } from '../common/problem/problems';
import { buildForecast } from './build-forecast';
import { ForecastRepository } from './forecast.repository';

/**
 * The next 24 hours of a series, with the band they should fall within and how the model
 * did on history it had not seen (docs/forecast-study.md). It is computed on each
 * request: the fit is a closed formula over at most 90 days of hourly means.
 */
@Injectable()
export class ForecastService {
  constructor(private readonly repository: ForecastRepository) {}

  async forecast(ownerId: string, seriesId: string): Promise<Forecast> {
    const quantity = await this.repository.quantityOfOwned(ownerId, seriesId);
    if (!quantity) throw notFound('Time-series');
    // One hour more than the history used: the latest hour is left out as incomplete.
    const means = await this.repository.hourlyMeans(seriesId, FORECAST.maxHistoryHours);
    // An RMS is never negative; a temperature may be.
    const floor = quantityMapping.fromDb(quantity) === 'temperature' ? null : 0;
    return buildForecast(means, floor);
  }
}
