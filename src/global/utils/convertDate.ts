import { parseISO } from "date-fns";

export const parseDate = (date: string | Date): Date => {
  return date instanceof Date ? date : parseISO(date);
};
