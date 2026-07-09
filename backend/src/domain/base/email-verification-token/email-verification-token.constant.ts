import myDayjs from '@/shared/common/common.dayjs';

export const EMAIL_VERIFICATION_TOKEN_EXPIRY_SECONDS = myDayjs
  .duration({ hours: 24 })
  .asSeconds();
