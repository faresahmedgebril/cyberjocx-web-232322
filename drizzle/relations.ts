import { relations } from "drizzle-orm";
import { cartItems, carts, courseProgress, courses, friendRequests, follows, notifications, postLikes, posts, sessions, users } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  courseProgress: many(courseProgress),
  posts: many(posts),
  notifications: many(notifications),
  carts: many(carts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({ progress: many(courseProgress) }));
export const courseProgressRelations = relations(courseProgress, ({ one }) => ({
  user: one(users, { fields: [courseProgress.userId], references: [users.id] }),
  course: one(courses, { fields: [courseProgress.courseId], references: [courses.id] }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.userId], references: [users.id] }),
  likes: many(postLikes),
}));
export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, { fields: [postLikes.postId], references: [posts.id] }),
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}));
export const cartItemsRelations = relations(cartItems, ({ one }) => ({ cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }) }));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id] }),
  following: one(users, { fields: [follows.followingId], references: [users.id] }),
}));
export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  sender: one(users, { fields: [friendRequests.senderId], references: [users.id] }),
  recipient: one(users, { fields: [friendRequests.recipientId], references: [users.id] }),
}));
