// ========== Response ==========
import { UserResponse } from '@/domain/base/user/user.domain';
import { IResponse, IStandardResponse } from '@/shared/type/type.http';

export type RefreshResponse = IStandardResponse<{
  user: IResponse<UserResponse>;
  token: string;
}>;
