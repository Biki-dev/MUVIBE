export interface CommunityHighlight {
  id: string;
  userId: string;
  /** First name, or "You" for the signed-in user. */
  name: string;
  initial: string;
  /** The single number shown, already formatted. */
  metric: string;
  /** Lucide icon name, see components/ui/icon-registry.ts. */
  icon: string;
  accentColor: string;
  isMe: boolean;
}
