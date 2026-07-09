import { AccountModule } from './base/account/account.module';
import { ConversationModule } from './base/conversation/conversation.module';
import { EmailVerificationTokenModule } from './base/email-verification-token/email-verification-token.module';
import { MessageModule } from './base/message/message.module';
import { MessageTaskModule } from './base/message-task/message-task.module';
import { SessionModule } from './base/session/session.module';
import { StoredFileModule } from './base/stored-file/stored-file.module';
import { UserModule } from './base/user/user.module';
import { QueueModule } from './queue/queue.module';

export const DOMAIN_PROVIDER = [
  //
  AccountModule,
  UserModule,
  SessionModule,
  StoredFileModule,
  MessageTaskModule,
  EmailVerificationTokenModule,

  //
  ConversationModule,
  MessageModule,

  //
  QueueModule,
];
