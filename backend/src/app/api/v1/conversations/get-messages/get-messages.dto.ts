import { MessageResponse } from '@/domain/base/message/message.domain';
import { IResponse, IStandardResponse } from '@/shared/type/type.http';

export type GetMessagesResponse = IStandardResponse<{
  messages: IResponse<MessageResponse>[];
}>;
