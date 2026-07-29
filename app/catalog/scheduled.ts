import type { D1DatabaseLike } from "./d1-contract";
import { runFreshnessChecks, runAccessChecks } from "./freshness-checker";

export interface ScheduledEvent {
  readonly scheduledTime: number;
  readonly cron: string;
}

export async function scheduledFreshnessCheck(
  event: ScheduledEvent,
  database: D1DatabaseLike,
): Promise<{ freshness: number; access: number }> {
  const freshnessResults = await runFreshnessChecks(database, 100);
  const accessResults = await runAccessChecks(database, 100);

  console.log(
    `[Freshness Check] ${new Date(event.scheduledTime).toISOString()} - ` +
      `checked ${freshnessResults.length} resources for freshness, ` +
      `${accessResults.length} for access`,
  );

  return {
    freshness: freshnessResults.length,
    access: accessResults.length,
  };
}