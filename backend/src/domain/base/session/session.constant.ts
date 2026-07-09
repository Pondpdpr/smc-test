import myDayjs from '@/shared/common/common.dayjs';

export const SESSION_DEFAULT_EXPIRY_SECONDS = myDayjs
  .duration({ days: 7 })
  .asSeconds();
