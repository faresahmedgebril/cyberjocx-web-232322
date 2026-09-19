import { TRPCError } from "@trpc/server";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { askAI, personalizeAI } from "./modules/ai/service";
import { readPublicProfile, updateProfile, uploadProfileMedia } from "./modules/profile/service";
import { nanoid } from "nanoid";
import { getSessionCookieOptions } from "./_core/cookies";
import { getSessionToken, revokeSession } from "./core/auth/session";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { books, cartItems, carts, certificates, courseProgress, courses, cves, friendRequests, follows, malwareFamilies, notifications, nvdSyncSettings, postLikes, posts, quizAttempts, quizQuestions, trackQuizzes, tracks, tools, users, getCart, getDashboardStats, getDb, getTrackProgress, getTrackRoadmap, getUserById, listBooks, listBooksAdvanced, listCourses, listCves, listCvesPaginated, listMalware, listPosts, listTools, listToolsAdvanced, listRoadmaps, listTracks, ensureCart } from "./db";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      void revokeSession(getSessionToken(ctx.req));
      ctx.res.clearCookie("cyberjocx_session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: protectedProcedure.query(({ ctx }) => getDashboardStats(ctx.user.id)),
  profile: router({
    me: protectedProcedure.query(({ ctx }) => ctx.user),
    byId: publicProcedure.input(z.object({ userId: z.number() })).query(({ input }) => readPublicProfile(input.userId)),
    update: protectedProcedure.input(z.object({ name: z.string().min(2).max(120).optional(), bio: z.string().max(500).optional(), avatarUrl: z.string().url().optional(), bannerUrl: z.string().url().optional(), phone: z.string().max(32).optional(), linkedinUrl: z.string().url().optional(), memberRank: z.enum(["learner", "contributor", "analyst", "mentor", "elite"]).optional(), primaryTrackId: z.number().optional() })).mutation(async ({ ctx, input }) => {
      return updateProfile(ctx.user.id, input);
    }),
    uploadMedia: protectedProcedure.input(z.object({ kind: z.enum(["avatar", "banner"]), dataUrl: z.string().max(4_200_000) })).mutation(async ({ ctx, input }) => {
      return uploadProfileMedia(ctx.user.id, input.kind, input.dataUrl);
    }),
  }),
  roadmaps: router({
    list: publicProcedure.query(({ ctx }) => listRoadmaps(ctx.user?.id)),
  }),
  tracks: router({
    list: publicProcedure.query(({ ctx }) => listTracks(ctx.user?.id)),
    roadmap: publicProcedure.input(z.object({ trackId: z.number() })).query(({ ctx, input }) => getTrackRoadmap(ctx.user?.id, input.trackId)),
    progress: protectedProcedure.input(z.object({ trackId: z.number() })).query(({ ctx, input }) => getTrackProgress(ctx.user.id, input.trackId)),
    submitQuiz: protectedProcedure.input(z.object({ quizId: z.number(), answers: z.array(z.number()) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, input.quizId)).orderBy(quizQuestions.orderIndex);
      const quiz = (await db.select().from(trackQuizzes).where(eq(trackQuizzes.id, input.quizId)).limit(1))[0];
      if (!quiz || !questions.length) throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found" });
      const correct = questions.reduce((sum, question, index) => sum + (input.answers[index] === question.answerIndex ? 1 : 0), 0);
      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= quiz.passingScore;
      await db.insert(quizAttempts).values({ quizId: input.quizId, userId: ctx.user.id, score, passed, answersJson: JSON.stringify(input.answers) });
      let certificateCode: string | undefined;
      if (passed) {
        const existingCertificate = quiz.trackLevelId ? (await db.select().from(certificates).where(and(eq(certificates.userId, ctx.user.id), eq(certificates.trackLevelId, quiz.trackLevelId))).limit(1))[0] : undefined;
        certificateCode = existingCertificate?.certificateCode ?? `CJX-${nanoid(10).toUpperCase()}`;
        if (!existingCertificate) await db.insert(certificates).values({ userId: ctx.user.id, trackId: quiz.trackId, trackLevelId: quiz.trackLevelId ?? null, certificateCode });
      }
      return { score, passed, certificateCode };
    }),
  }),
  courses: router({
    list: publicProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listCourses(input?.search)),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return undefined;
      const rows = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1);
      return rows[0];
    }),
    progress: protectedProcedure.input(z.object({ courseId: z.number(), progress: z.number().min(0).max(100) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const completed = input.progress >= 100;
      const existing = await db.select().from(courseProgress).where(and(eq(courseProgress.userId, ctx.user.id), eq(courseProgress.courseId, input.courseId))).limit(1);
      if (existing[0]) await db.update(courseProgress).set({ progress: input.progress, completed }).where(eq(courseProgress.id, existing[0].id));
      else await db.insert(courseProgress).values({ userId: ctx.user.id, courseId: input.courseId, progress: input.progress, completed });
      return { success: true, completed };
    }),
  }),
  cves: router({
    list: publicProcedure.input(z.object({ search: z.string().optional(), severity: z.enum(["critical", "high", "medium", "low"]).optional() }).optional()).query(({ input }) => listCves(input?.search, input?.severity)),
    paginated: publicProcedure.input(z.object({ search: z.string().optional(), severity: z.enum(["critical", "high", "medium", "low"]).optional(), page: z.number().min(1).default(1), pageSize: z.number().min(1).max(50).default(12) })).query(({ input }) => listCvesPaginated(input.search, input.severity, input.page, input.pageSize)),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return undefined;
      const rows = await db.select().from(cves).where(eq(cves.id, input.id)).limit(1);
      return rows[0];
    }),
  }),
  tools: router({
    list: publicProcedure.input(z.object({ search: z.string().optional(), category: z.string().optional() }).optional()).query(({ input }) => listTools(input?.search, input?.category)),
    advanced: publicProcedure.input(z.object({ search: z.string().optional(), category: z.string().optional(), sort: z.enum(["name", "category", "recent"]).optional() }).optional()).query(({ input }) => listToolsAdvanced(input?.search, input?.category, input?.sort)),
  }),
  community: router({
    feed: publicProcedure.query(() => listPosts()),
    create: protectedProcedure.input(z.object({ content: z.string().min(1).max(4000), imageUrl: z.string().url().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.insert(posts).values({ userId: ctx.user.id, content: input.content, imageUrl: input.imageUrl });
      return { success: true };
    }),
    follow: protectedProcedure.input(z.object({ userId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid target" });
      const existing = await db.select().from(follows).where(and(eq(follows.followerId, ctx.user.id), eq(follows.followingId, input.userId))).limit(1);
      if (existing[0]) { await db.delete(follows).where(eq(follows.id, existing[0].id)); return { following: false }; }
      await db.insert(follows).values({ followerId: ctx.user.id, followingId: input.userId });
      return { following: true };
    }),
    friendRequests: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(friendRequests).where(eq(friendRequests.recipientId, ctx.user.id)).orderBy(desc(friendRequests.createdAt));
    }),
    friends: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const requests = await db.select().from(friendRequests).where(and(eq(friendRequests.status, "accepted"), or(eq(friendRequests.senderId, ctx.user.id), eq(friendRequests.recipientId, ctx.user.id))));
      const friendIds = requests.map(request => request.senderId === ctx.user.id ? request.recipientId : request.senderId);
      if (!friendIds.length) return [];
      const allUsers = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, memberRank: users.memberRank, primaryTrackId: users.primaryTrackId }).from(users);
      return allUsers.filter(item => friendIds.includes(item.id));
    }),
    sendFriendRequest: protectedProcedure.input(z.object({ userId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid user" });
      const existing = await db.select().from(friendRequests).where(and(eq(friendRequests.senderId, ctx.user.id), eq(friendRequests.recipientId, input.userId))).limit(1);
      if (existing[0]) return { success: true, status: existing[0].status };
      await db.insert(friendRequests).values({ senderId: ctx.user.id, recipientId: input.userId });
      return { success: true, status: "pending" as const };
    }),
    respondFriendRequest: protectedProcedure.input(z.object({ requestId: z.number(), accept: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const request = (await db.select().from(friendRequests).where(and(eq(friendRequests.id, input.requestId), eq(friendRequests.recipientId, ctx.user.id))).limit(1))[0];
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });
      await db.update(friendRequests).set({ status: input.accept ? "accepted" : "declined" }).where(eq(friendRequests.id, request.id));
      return { success: true };
    }),
    like: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const existing = await db.select().from(postLikes).where(and(eq(postLikes.postId, input.postId), eq(postLikes.userId, ctx.user.id))).limit(1);
      if (existing[0]) {
        await db.delete(postLikes).where(eq(postLikes.id, existing[0].id));
        await db.update(posts).set({ likesCount: sql`${posts.likesCount} - 1` }).where(eq(posts.id, input.postId));
        return { liked: false };
      }
      await db.insert(postLikes).values({ postId: input.postId, userId: ctx.user.id });
      await db.update(posts).set({ likesCount: sql`${posts.likesCount} + 1` }).where(eq(posts.id, input.postId));
      return { liked: true };
    }),
  }),
  market: router({
    books: publicProcedure.query(() => listBooks()),
    booksAdvanced: publicProcedure.input(z.object({ search: z.string().optional(), category: z.string().optional(), maxPoints: z.number().min(0).optional(), sort: z.enum(["title", "price", "recent"]).optional() }).optional()).query(({ input }) => listBooksAdvanced(input?.search, input?.category, input?.maxPoints, input?.sort)),
    cart: protectedProcedure.query(({ ctx }) => getCart(ctx.user.id)),
    addToCart: protectedProcedure.input(z.object({ bookId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const cart = await ensureCart(ctx.user.id);
      if (!db || !cart) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cart unavailable" });
      const existing = await db.select().from(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.bookId, input.bookId))).limit(1);
      if (existing[0]) await db.update(cartItems).set({ quantity: sql`${cartItems.quantity} + 1` }).where(eq(cartItems.id, existing[0].id));
      else await db.insert(cartItems).values({ cartId: cart.id, bookId: input.bookId, quantity: 1 });
      return { success: true };
    }),
    removeFromCart: protectedProcedure.input(z.object({ itemId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const cart = await ensureCart(ctx.user.id);
      if (!db || !cart) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cart unavailable" });
      await db.delete(cartItems).where(and(eq(cartItems.id, input.itemId), eq(cartItems.cartId, cart.id)));
      return { success: true };
    }),
  }),
  malware: router({
    list: publicProcedure.input(z.object({ search: z.string().optional(), category: z.string().optional() }).optional()).query(({ input }) => listMalware(input?.search, input?.category)),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return undefined;
      return (await db.select().from(malwareFamilies).where(eq(malwareFamilies.id, input.id)).limit(1))[0];
    }),
  }),
  nvd: router({
    status: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { lastStatus: "unavailable", lastCompletedAt: null, lastImported: 0 };
      const row = (await db.select().from(nvdSyncSettings).limit(1))[0];
      return row ? { lastStatus: row.lastStatus, lastCompletedAt: row.lastCompletedAt, lastImported: row.lastImported } : { lastStatus: "never", lastCompletedAt: null, lastImported: 0 };
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(notifications).where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(30);
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
      return { success: true };
    }),
  }),
  ai: router({
    ask: protectedProcedure.input(z.object({ message: z.string().min(2).max(4000), history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(12).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const [trackRows, courseRows, malwareRows, cveCount] = db ? await Promise.all([
        db.select({ title: tracks.title }).from(tracks).limit(12),
        db.select({ title: courses.title }).from(courses).where(eq(courses.isPublished, true)).limit(18),
        db.select({ name: malwareFamilies.name }).from(malwareFamilies).limit(12),
        db.select({ count: sql<number>`count(*)` }).from(cves),
      ]) : [[], [], [], [] as { count: number }[]];
      const currentUser = await getUserById(ctx.user.id);
      const platformContext = `بيانات CyberJocx المتاحة الآن: المسارات: ${trackRows.map(row => row.title).join(" | ") || "غير مفهرسة"}. الدورات: ${courseRows.map(row => row.title).join(" | ") || "غير مفهرسة"}. عائلات Malware المرصودة: ${malwareRows.map(row => row.name).join(" | ") || "غير مفهرسة"}. عدد سجلات CVE في المنصة: ${Number(cveCount[0]?.count ?? 0)}. المسار الأساسي للمستخدم: ${currentUser?.primaryTrackId ?? "لم يختر مسارًا بعد"}. لا تدّعِ الوصول إلى أي بيانات شخصية لمستخدمين آخرين.`;
      const response = await askAI({ message: input.message, history: input.history, context: platformContext });
      return { answer: response.content, model: response.model, usage: { inputTokens: response.inputTokens, outputTokens: response.outputTokens, totalTokens: response.totalTokens } };
    }),
    personalizeRoadmap: protectedProcedure.input(z.object({ trackId: z.number() })).mutation(async ({ ctx, input }) => {
      const roadmap = await getTrackRoadmap(ctx.user.id, input.trackId);
      if (!roadmap) throw new TRPCError({ code: "NOT_FOUND", message: "المسار غير موجود." });
      const outline = roadmap.levels.map(level => ({ title: level.title, requirements: level.requirements, modules: level.modules.map(module => module.title) }));
      const response = await personalizeAI({ userName: ctx.user.name ?? "متعلم", track: roadmap.track.title, currentLevel: roadmap.currentLevel, outline });
      return { roadmap: response.content, model: response.model, usage: { inputTokens: response.inputTokens, outputTokens: response.outputTokens, totalTokens: response.totalTokens } };
    }),
  }),
  admin: router({
    content: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { courses: [], tools: [], cves: [] };
      const [courseRows, toolRows, cveRows] = await Promise.all([
        db.select({ id: courses.id, title: courses.title, category: courses.category }).from(courses).orderBy(desc(courses.createdAt)).limit(20),
        db.select({ id: tools.id, name: tools.name, category: tools.category }).from(tools).orderBy(tools.name).limit(20),
        db.select({ id: cves.id, cveNumber: cves.cveNumber, severity: cves.severity }).from(cves).orderBy(desc(cves.createdAt)).limit(20),
      ]);
      return { courses: courseRows, tools: toolRows, cves: cveRows };
    }),
    deleteCourse: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(courses).where(eq(courses.id, input.id));
      return { success: true };
    }),
    deleteTool: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(tools).where(eq(tools.id, input.id));
      return { success: true };
    }),
    deleteCve: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(cves).where(eq(cves.id, input.id));
      return { success: true };
    }),
    stats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { users: 0, courses: 0, cves: 0, tools: 0, posts: 0 };
      const [usersCount, coursesCount, cvesCount, toolsCount, postsCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(users),
        db.select({ count: sql<number>`count(*)` }).from(courses),
        db.select({ count: sql<number>`count(*)` }).from(cves),
        db.select({ count: sql<number>`count(*)` }).from(tools),
        db.select({ count: sql<number>`count(*)` }).from(posts),
      ]);
      return { users: Number(usersCount[0]?.count ?? 0), courses: Number(coursesCount[0]?.count ?? 0), cves: Number(cvesCount[0]?.count ?? 0), tools: Number(toolsCount[0]?.count ?? 0), posts: Number(postsCount[0]?.count ?? 0) };
    }),
    createCourse: adminProcedure.input(z.object({ title: z.string(), slug: z.string(), description: z.string(), category: z.string(), level: z.enum(["beginner", "intermediate", "advanced"]), instructor: z.string(), lessons: z.number(), durationMinutes: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(courses).values(input);
      const recipients = await db.select({ id: users.id }).from(users);
      if (recipients.length) await db.insert(notifications).values(recipients.map(recipient => ({ userId: recipient.id, type: "content" as const, title: "New learning node published", message: `${input.title} is now available in the learning matrix.` })));
      return { success: true };
    }),
    createTool: adminProcedure.input(z.object({ name: z.string(), category: z.string(), description: z.string(), commands: z.string().optional(), downloadUrl: z.string().optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(tools).values(input);
      const recipients = await db.select({ id: users.id }).from(users);
      if (recipients.length) await db.insert(notifications).values(recipients.map(recipient => ({ userId: recipient.id, type: "content" as const, title: "Toolkit repository updated", message: `${input.name} has been added to the security toolkit.` })));
      return { success: true };
    }),
    createCve: adminProcedure.input(z.object({ cveNumber: z.string(), title: z.string(), description: z.string(), severity: z.enum(["critical", "high", "medium", "low"]), cvss: z.string(), publishedDate: z.string(), affected: z.string(), sourceUrl: z.string().optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(cves).values(input);
      if (input.severity === "critical" || input.severity === "high") {
        const recipients = await db.select({ id: users.id }).from(users);
        if (recipients.length) await db.insert(notifications).values(recipients.map(recipient => ({ userId: recipient.id, type: "cve" as const, title: `CVE ${input.severity.toUpperCase()} detected`, message: `${input.cveNumber}: ${input.title}` })));
      }
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
