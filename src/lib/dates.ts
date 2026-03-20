import { formatDistanceToNowStrict } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const APP_TIMEZONE = "Europe/Zurich";

export function buildMarketCloseAt(voteDate: string) {
  return fromZonedTime(`${voteDate}T00:00:00`, APP_TIMEZONE).toISOString();
}

export function formatVoteDate(voteDate: string) {
  const noonInZurich = fromZonedTime(`${voteDate}T12:00:00`, APP_TIMEZONE);

  return formatInTimeZone(noonInZurich, APP_TIMEZONE, "d MMM yyyy");
}

export function formatDateTime(value: string) {
  return formatInTimeZone(value, APP_TIMEZONE, "d MMM yyyy, HH:mm zzz");
}

export function isMarketOpen(marketClosesAt: string, now = new Date()) {
  return now.getTime() < new Date(marketClosesAt).getTime();
}

export function formatRelativeDeadline(marketClosesAt: string) {
  const target = new Date(marketClosesAt);

  if (target.getTime() <= Date.now()) {
    return "Closed";
  }

  return formatDistanceToNowStrict(target, { addSuffix: true });
}

export function toChartTimestamp(value: string) {
  return Math.floor(new Date(value).getTime() / 1000);
}

