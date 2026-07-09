import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(dayOfYear);
dayjs.extend(duration);

dayjs.tz.setDefault('Asia/Bangkok');

const myDayjs = dayjs;

export default myDayjs;
