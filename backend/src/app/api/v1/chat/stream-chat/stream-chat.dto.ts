import z from 'zod';

import { zodDto } from '@/shared/zod/zod.util';

const zod = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1),
});

export type StreamChatInput = z.input<typeof zod>;
export class StreamChatDto extends zodDto(zod) {}
