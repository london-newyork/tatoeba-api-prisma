import { format } from 'date-fns';

export const dateFormat = {
  date: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

export type DateFormat = typeof dateFormat[keyof typeof dateFormat];

export type FormattedDate = (date: Date, format: DateFormat) => DateFormat;

export const formatDate: FormattedDate = (date, dateFormat): DateFormat =>
  format(date, dateFormat) as DateFormat;
