import { format } from 'date-fns';

const dateFormat = {
  date: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

type DateFormat = typeof dateFormat[keyof typeof dateFormat];

type FormattedDate = (date: Date, format: DateFormat) => DateFormat;

export const formatDate: FormattedDate = (date, dateFormat): DateFormat =>
  format(date, dateFormat) as DateFormat;
