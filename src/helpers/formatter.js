import dayjs from 'dayjs';
import moment from 'moment';

export const dateFormatter = (value, fmt = 'M/D/YYYY') =>
  //value ? dayjs(value).format(fmt) : '';
  value ? moment.utc(value).local().format(fmt) : '';

export const dateTimeFormatter = (value, fmt = "MM-DD-YYYY HH:mm:ss") =>
  value ? moment.utc(value).local().format(fmt) : '';
