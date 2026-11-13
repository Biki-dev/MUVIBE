/**
 * src/services/community-service.ts
 * ─────────────────────────────────────────────────────────────────
 * Clubs, posts and club leaderboards, from Supabase, with a read-only
 * offline snapshot on the list reads.
 * ─────────────────────────────────────────────────────────────────
 */
import { withSnapshot } from '@/lib/offline-cache';
import * as remote from './remote/community-service';
import {
  CommunityClub,
  ClubMemberRankItem,
  ClubDiscussionPost,
  ClubPostComment,
} from '@/types/community';
import { Challenge } from '@/types/challenge';

export function fetchCommunityClubs(
  userId?: string
): Promise<{ clubs: CommunityClub[]; myClubs: CommunityClub[] }> {
  return withSnapshot('clubs', () => remote.fetchCommunityClubs(userId), {
    isEmpty: (v) => v.clubs.length === 0,
  });
}

export function fetchCommunityClubsLeaderboard(): Promise<CommunityClub[]> {
  return remote.fetchCommunityClubsLeaderboard();
}

export function fetchClubLeaderboard(
  clubId: string,
  currentUserId?: string
): Promise<ClubMemberRankItem[]> {
  return remote.fetchClubLeaderboard(clubId, currentUserId);
}

export function joinClubInDB(clubId: string, userId: string): Promise<boolean> {
  return remote.joinClubInDB(clubId, userId);
}

export function leaveClubInDB(clubId: string, userId: string): Promise<boolean> {
  return remote.leaveClubInDB(clubId, userId);
}

export function fetchClubPosts(clubId: string, userId?: string): Promise<ClubDiscussionPost[]> {
  return remote.fetchClubPosts(clubId, userId);
}

export function createClubPost(
  clubId: string,
  userId: string,
  data: { title: string; content: string; imageUrl?: string; linkUrl?: string }
): Promise<boolean> {
  return remote.createClubPost(clubId, userId, data);
}

export function voteClubPost(
  postId: string,
  userId: string,
  voteType: 1 | -1
): Promise<{ score: number; userVote: 1 | -1 | 0 } | null> {
  return remote.voteClubPost(postId, userId, voteType);
}

export function fetchPostComments(postId: string): Promise<ClubPostComment[]> {
  return remote.fetchPostComments(postId);
}

export function createPostComment(
  postId: string,
  userId: string,
  content: string
): Promise<boolean> {
  return remote.createPostComment(postId, userId, content);
}

export function fetchClubChallenges(clubId: string, userId?: string): Promise<Challenge[]> {
  return remote.fetchClubChallenges(clubId, userId);
}

export function subscribeToCommunity(onUpdate: () => void): () => void {
  return remote.subscribeToCommunity(onUpdate);
}
