import type { Conversations } from '@/infra/db/db';
import type { DBModel } from '@/infra/db/db.common';
import type { WithState } from '@/shared/common/common.domain';
import type { Serialized } from '@/shared/type/type.common';

type ConversationPlain = {
  readonly id: string;
  readonly userId: string;
  title: string;
  readonly createdAt: Date;
  updatedAt: Date;
};

export type ConversationPg = DBModel<Conversations>;
export type Conversation = WithState<ConversationPg> & ConversationPlain;
export type ConversationJson = WithState<ConversationPg> &
  Serialized<ConversationPlain>;

export type ConversationResponse = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ConversationNewData = {
  userId: string;
  title?: string;
};

export type ConversationUpdateData = {
  title?: string;
};
