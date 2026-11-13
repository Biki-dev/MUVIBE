import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { ClubDiscussionPost, ClubPostComment } from '@/types/community';
import {
  voteClubPost,
  createClubPost,
  fetchPostComments,
  createPostComment,
} from '@/services/community-service';

interface ClubDiscussionTabProps {
  clubId: string;
  posts: ClubDiscussionPost[];
  isJoined: boolean;
  userId?: string;
  onRefresh: () => void;
}

export function ClubDiscussionTab({
  clubId,
  posts,
  isJoined,
  userId,
  onRefresh,
}: ClubDiscussionTabProps) {
  const [localPosts, setLocalPosts] = useState<ClubDiscussionPost[]>(posts);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Active expanded comments
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, ClubPostComment[]>>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Sync props to state if props update
  React.useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  // Upvote / Downvote handler
  const handleVote = async (postId: string, voteType: 1 | -1) => {
    if (!isJoined) {
      Alert.alert('Members Only', 'Join this club to vote and engage with member posts.');
      return;
    }
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to vote.');
      return;
    }

    // Optimistic UI update
    setLocalPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const currentVote = p.userVote;
        let newVote: 1 | -1 | 0 = voteType;
        let scoreDelta = 0;

        if (currentVote === voteType) {
          // Toggle off
          newVote = 0;
          scoreDelta = -voteType;
        } else if (currentVote === 0) {
          scoreDelta = voteType;
        } else {
          // Switch from opposite
          scoreDelta = voteType * 2;
        }

        return {
          ...p,
          userVote: newVote,
          score: p.score + scoreDelta,
        };
      })
    );

    const res = await voteClubPost(postId, userId, voteType);
    if (res) {
      setLocalPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, score: res.score, userVote: res.userVote } : p))
      );
    }
  };

  // Toggle comments
  const toggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      if (!postComments[postId]) {
        const comments = await fetchPostComments(postId);
        setPostComments((prev) => ({ ...prev, [postId]: comments }));
      }
    }
  };

  // Submit comment
  const handleSubmitComment = async (postId: string) => {
    if (!isJoined) {
      Alert.alert('Members Only', 'Join this club to comment on member discussions.');
      return;
    }
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to comment.');
      return;
    }
    if (!newCommentText.trim()) return;

    setIsSubmittingComment(true);
    const success = await createPostComment(postId, userId, newCommentText.trim());
    setIsSubmittingComment(false);

    if (success) {
      setNewCommentText('');
      const updated = await fetchPostComments(postId);
      setPostComments((prev) => ({ ...prev, [postId]: updated }));
      setLocalPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
      );
    }
  };

  // Submit new post
  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Missing Fields', 'Please enter a post title and message.');
      return;
    }
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to create a post.');
      return;
    }

    setIsSubmittingPost(true);
    const success = await createClubPost(clubId, userId, {
      title: newTitle.trim(),
      content: newContent.trim(),
      imageUrl: newImageUrl.trim() || undefined,
      linkUrl: newLinkUrl.trim() || undefined,
    });
    setIsSubmittingPost(false);

    if (success) {
      setNewTitle('');
      setNewContent('');
      setNewImageUrl('');
      setNewLinkUrl('');
      setIsCreateModalOpen(false);
      onRefresh();
    } else {
      Alert.alert('Error', 'Unable to create post. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Action Row: Create Post Button */}
      <View style={styles.topActionRow}>
        <View style={styles.communitySubInfo}>
          <Text style={styles.heading}>Club Discussion Feed</Text>
          <Text style={styles.subheading}>Campus community thoughts, gear & routes</Text>
        </View>

        <Pressable
          onPress={() => {
            if (!isJoined) {
              Alert.alert('Members Only', 'Join this club to start a discussion.');
              return;
            }
            setIsCreateModalOpen(true);
          }}
          style={styles.newPostButton}>
          <AppIcon name="add" size={16} color={Palette.ink} />
          <Text style={styles.newPostText}>New Post</Text>
        </Pressable>
      </View>

      {/* Posts List */}
      {localPosts.length === 0 ? (
        <View style={styles.emptyCard}>
          <AppIcon name="chatbubbles-outline" size={36} color={Palette.muted} />
          <Text style={styles.emptyTitle}>No Discussions Yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to start a conversation, share routes, or ask training tips!
          </Text>
        </View>
      ) : (
        localPosts.map((post) => {
          const isUpvoted = post.userVote === 1;
          const isDownvoted = post.userVote === -1;
          const isExpanded = expandedPostId === post.id;
          const comments = postComments[post.id] || [];

          return (
            <View key={post.id} style={styles.postCard}>
              {/* Reddit-style Layout: Left Vote Bar + Right Content */}
              <View style={styles.postInner}>
                {/* Left Vote Column */}
                <View style={styles.voteCol}>
                  <Pressable
                    onPress={() => handleVote(post.id, 1)}
                    style={[styles.voteArrowBtn, isUpvoted && styles.upvotedActive]}
                    hitSlop={6}>
                    <AppIcon
                      name="arrow-up"
                      size={18}
                      color={isUpvoted ? Palette.forest : Palette.muted}
                    />
                  </Pressable>

                  <Text
                    style={[
                      styles.scoreText,
                      isUpvoted && styles.scoreUpvoted,
                      isDownvoted && styles.scoreDownvoted,
                    ]}>
                    {post.score}
                  </Text>

                  <Pressable
                    onPress={() => handleVote(post.id, -1)}
                    style={[styles.voteArrowBtn, isDownvoted && styles.downvotedActive]}
                    hitSlop={6}>
                    <AppIcon
                      name="arrow-down"
                      size={18}
                      color={isDownvoted ? Palette.coral : Palette.muted}
                    />
                  </Pressable>
                </View>

                {/* Right Content Area */}
                <View style={styles.contentCol}>
                  {/* Author Header */}
                  <View style={styles.authorRow}>
                    <View
                      style={[
                        styles.authorAvatar,
                        { backgroundColor: post.authorAvatarColor || Palette.lime },
                      ]}>
                      <Text style={styles.authorInitial}>
                        {(post.authorName || 'A').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.authorName}>{post.authorName}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.postTime}>{post.formattedDate}</Text>
                  </View>

                  {/* Title & Body */}
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postBody}>{post.content}</Text>

                  {/* Link Attachment */}
                  {post.linkUrl && (
                    <Pressable
                      onPress={() => Linking.openURL(post.linkUrl!).catch(() => {})}
                      style={styles.linkBadge}>
                      <AppIcon name="link-outline" size={13} color={Palette.electricBlue} />
                      <Text style={styles.linkText} numberOfLines={1}>
                        {post.linkUrl}
                      </Text>
                    </Pressable>
                  )}

                  {/* Image Attachment */}
                  {post.imageUrl && (
                    <View style={styles.imageWrap}>
                      <Image
                        source={{ uri: post.imageUrl }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {/* Footer Action: Comments button */}
                  <Pressable
                    onPress={() => toggleComments(post.id)}
                    style={styles.commentBtnRow}>
                    <AppIcon name="chatbubble-outline" size={14} color={Palette.muted} />
                    <Text style={styles.commentBtnText}>
                      {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Expandable Comments Drawer */}
              {isExpanded && (
                <View style={styles.commentsDrawer}>
                  <View style={styles.commentsDivider} />

                  {/* Existing comments list */}
                  {comments.length === 0 ? (
                    <Text style={styles.noCommentsText}>No comments yet. Leave the first one!</Text>
                  ) : (
                    comments.map((c) => (
                      <View key={c.id} style={styles.commentItem}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentAuthor}>{c.authorName}</Text>
                          <Text style={styles.commentTime}>{c.formattedDate}</Text>
                        </View>
                        <Text style={styles.commentBody}>{c.content}</Text>
                      </View>
                    ))
                  )}

                  {/* Add comment input */}
                  {isJoined ? (
                    <View style={styles.addCommentRow}>
                      <TextInput
                        value={newCommentText}
                        onChangeText={setNewCommentText}
                        placeholder="Add a comment..."
                        placeholderTextColor={Palette.muted}
                        style={styles.commentInput}
                      />
                      <Pressable
                        onPress={() => handleSubmitComment(post.id)}
                        disabled={isSubmittingComment}
                        style={styles.sendCommentBtn}>
                        <AppIcon name="send" size={14} color={Palette.white} />
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.joinToCommentNotice}>
                      Join club to reply and comment.
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}

      {/* Create New Post Modal */}
      <Modal visible={isCreateModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Club Discussion</Text>
              <Pressable onPress={() => setIsCreateModalOpen(false)}>
                <AppIcon name="close" size={22} color={Palette.ink} />
              </Pressable>
            </View>

            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Post Title (e.g. Morning 5K Pace Group)"
              placeholderTextColor={Palette.muted}
              style={styles.inputTitle}
            />

            <TextInput
              value={newContent}
              onChangeText={setNewContent}
              placeholder="What would you like to discuss with the club?"
              placeholderTextColor={Palette.muted}
              multiline
              numberOfLines={4}
              style={styles.inputBody}
            />

            <TextInput
              value={newImageUrl}
              onChangeText={setNewImageUrl}
              placeholder="Optional Image URL (https://...)"
              placeholderTextColor={Palette.muted}
              style={styles.inputMeta}
            />

            <TextInput
              value={newLinkUrl}
              onChangeText={setNewLinkUrl}
              placeholder="Optional Link / Route URL (https://...)"
              placeholderTextColor={Palette.muted}
              style={styles.inputMeta}
            />

            <View style={styles.modalButtons}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setIsCreateModalOpen(false)}
              />
              <Button
                label="Publish Post"
                variant="primary"
                loading={isSubmittingPost}
                onPress={handleCreatePost}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.space2,
  },
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.space4,
  },
  communitySubInfo: {
    flex: 1,
  },
  heading: {
    ...Typography.sectionHeading,
    fontSize: 16,
    color: Palette.ink,
  },
  subheading: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
  },
  newPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.lime,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.btn,
  },
  newPostText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  emptyCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space5,
    alignItems: 'center',
    marginVertical: Spacing.space3,
  },
  emptyTitle: {
    ...Typography.cardHeading,
    fontSize: 15,
    color: Palette.ink,
    marginTop: Spacing.space2,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: Spacing.space3,
    overflow: 'hidden',
  },
  postInner: {
    flexDirection: 'row',
    padding: Spacing.space3,
  },
  voteCol: {
    alignItems: 'center',
    paddingRight: 12,
    paddingTop: 2,
    width: 38,
  },
  voteArrowBtn: {
    padding: 3,
    borderRadius: 4,
  },
  upvotedActive: {
    backgroundColor: 'rgba(24, 53, 45, 0.1)',
  },
  downvotedActive: {
    backgroundColor: 'rgba(229, 108, 103, 0.1)',
  },
  scoreText: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.ink,
    marginVertical: 2,
  },
  scoreUpvoted: {
    color: Palette.forest,
  },
  scoreDownvoted: {
    color: Palette.coral,
  },
  contentCol: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  authorName: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  dot: {
    color: Palette.muted,
    fontSize: 10,
    fontFamily: FontFamily.regular,
  },
  postTime: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
  postTitle: {
    ...Typography.cardHeading,
    fontSize: 15,
    color: Palette.ink,
    marginBottom: 4,
  },
  postBody: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.ink,
    lineHeight: 18,
    marginBottom: 6,
  },
  linkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  linkText: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.electricBlue,
    textDecorationLine: 'underline',
  },
  imageWrap: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginVertical: 6,
    maxHeight: 220,
  },
  postImage: {
    width: '100%',
    height: 180,
  },
  commentBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  commentBtnText: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
  },
  commentsDrawer: {
    backgroundColor: Palette.surfaceHighlight,
    paddingHorizontal: Spacing.space3,
    paddingBottom: Spacing.space3,
  },
  commentsDivider: {
    height: 1,
    backgroundColor: Palette.border,
    marginBottom: Spacing.space3,
  },
  noCommentsText: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
    marginBottom: Spacing.space2,
  },
  commentItem: {
    backgroundColor: Palette.white,
    padding: Spacing.space2 + 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentAuthor: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  commentTime: {
    ...Typography.supporting,
    fontSize: 10.5,
    color: Palette.muted,
  },
  commentBody: {
    ...Typography.body,
    fontSize: 12,
    color: Palette.ink,
    lineHeight: 16,
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Palette.ink,
  },
  sendCommentBtn: {
    backgroundColor: Palette.forest,
    padding: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinToCommentNotice: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
    textAlign: 'center',
    paddingVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.space4,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.space3,
  },
  modalTitle: {
    ...Typography.sectionHeading,
    fontSize: 17,
    color: Palette.ink,
  },
  inputTitle: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Palette.ink,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    marginBottom: 10,
  },
  inputBody: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Palette.ink,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  inputMeta: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Palette.ink,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: Spacing.space3,
  },
});
