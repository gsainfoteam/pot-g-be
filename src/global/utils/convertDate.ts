import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";

export const parseSeoulDate = (date: string | Date): Date => {
  return date instanceof Date ? date : parseISO(date);
};

export const toDateFormatWithTimezone = (date: Date): string => {
  return formatInTimeZone(date, "Asia/Seoul", "yyyy-MM-dd'T'HH:mm:ssXXX");
};
