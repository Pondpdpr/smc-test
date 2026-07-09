import { ConversationResponse } from '@/domain/base/conversation/conversation.domain';
import { IResponse, IStandardResponse } from '@/shared/type/type.http';

export type ListConversationsResponse = IStandardResponse<{
  conversations: IResponse<ConversationResponse>[];
}>;
