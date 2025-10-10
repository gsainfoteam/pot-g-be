import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const parseSeoulDate = (date: string | Date): Date => {
  return date instanceof Date ? date : toZonedTime(date, "Asia/Seoul");
};

export const toSeoulDateFormat = (date: Date): string => {
  return formatInTimeZone(date, "Asia/Seoul", "yyyy-MM-dd'T'HH:mm:ss");
};
