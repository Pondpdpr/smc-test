import { UserResponse } from '@/domain/base/user/user.domain';
import { IResponse, IStandardResponse } from '@/shared/type/type.http';

// Response

export type DeleteUserResponse = IStandardResponse<{
  user: IResponse<UserResponse>;
}>;
