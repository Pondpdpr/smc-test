import { useState } from 'react';
import { LogOutIcon, MessageSquarePlusIcon, Trash2Icon, XIcon } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/shared/lib/auth-context';
import { cn } from '@/shared/lib/utils';
import type { Conversation } from '@/shared/domain/conversation.domain';

type SidebarProps = {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function Sidebar({
  conversations,
  selectedId,
  onSelect,
  onNewChat,
  onDelete,
  open,
  onOpenChange,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDeleteId) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(pendingDeleteId);
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  }

  return (
    <>
      {/* Backdrop only exists as a mobile concept - the sidebar is always
          in-flow (no overlay) at md+, so this never renders there. */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-72 shrink-0 flex-col overflow-hidden border-r bg-muted transition-transform duration-200 md:static md:z-auto md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2 p-3">
          <Button
            onClick={() => {
              onNewChat();
              onOpenChange(false);
            }}
            variant="outline"
            className="min-w-0 flex-1 justify-start gap-2"
          >
            <MessageSquarePlusIcon className="size-4" />
            New chat
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            onClick={() => onOpenChange(false)}
            aria-label="Close sidebar"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <nav className="flex flex-col gap-0.5 p-2">
            {conversations.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                No conversations yet.
              </p>
            )}
            {conversations.map((conversation) => (
              <div key={conversation.id} className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(conversation.id);
                    onOpenChange(false);
                  }}
                  className={cn(
                    'w-full truncate rounded-md px-3 py-2 pr-8 text-left text-sm hover:bg-accent',
                    selectedId === conversation.id && 'bg-accent font-medium',
                  )}
                >
                  {conversation.title}
                </button>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  onClick={() => setPendingDeleteId(conversation.id)}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground opacity-100 hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="flex items-center justify-between gap-2 border-t p-3">
          <span className="truncate text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
            <LogOutIcon className="size-4" />
          </Button>
        </div>
      </aside>

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the conversation and all its messages. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
