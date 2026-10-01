import { Injectable } from '@nestjs/common';
import type { DbQuantity } from '@condition-monitor/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { HourlyMean } from './build-forecast';

/** Reads what a forecast is computed from (ADR 0002). */
@Injectable()
export class ForecastRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The quantity of a series of the user, or null when there is none (A4). */
  async quantityOfOwned(ownerId: string, seriesId: string): Promise<DbQuantity | null> {
    const series = await this.prisma.timeSeries.findFirst({
      where: { id: seriesId, monitoringPoint: { machine: { sector: { ownerId } } } },
      select: { quantity: true },
    });
    return series?.quantity ?? null;
  }

  /**
   * The mean of the readings of each hour, oldest first, over the last `hours` hours of
   * the series. The database aggregates, so a series of 50,000 readings arrives as a few
   * thousand rows. Hours are cut in UTC, whatever the time zone of the session.
   */
  hourlyMeans(seriesId: string, hours: number): Promise<HourlyMean[]> {
    return this.prisma.$queryRaw<HourlyMean[]>`
      WITH latest AS (
        SELECT max(timestamp) AS at FROM readings WHERE series_id = ${seriesId}::uuid
      )
      SELECT date_trunc('hour', r.timestamp, 'UTC') AS hour, avg(r.value) AS value
      FROM readings r, latest
      WHERE r.series_id = ${seriesId}::uuid
        AND r.timestamp >= date_trunc('hour', latest.at, 'UTC') - ${hours} * interval '1 hour'
      GROUP BY 1
      ORDER BY 1`;
  }
}
