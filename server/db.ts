import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { ENV } from "./_core/env";
import { getDatabase } from "./infrastructure/database/client";
import {
  books,
  cartItems,
  carts,
  courseProgress,
  courses,
  cves,
  friendRequests,
  follows,
  malwareFamilies,
  notifications,
  nvdSyncRuns,
  nvdSyncSettings,
  postLikes,
  posts,
  roadmapCourses,
  roadmaps,
  trackCourses,
  trackLevelModules,
  trackLevels,
  trackQuizzes,
  trackTools,
  tracks,
  tools,
  userTrackLevels,
  users,
  quizAttempts,
  quizQuestions,
  certificates,
  type InsertUser,
} from "../drizzle/schema";

export async function getDb() {
  return getDatabase();
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, points: user.points ?? 640 };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  for (const field of ["name", "email", "loginMethod", "bio", "avatarUrl"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.OWNER_OPEN_ID) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function listRoadmaps(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(roadmaps).orderBy(desc(roadmaps.createdAt));
  const progressRows = userId ? await db.select({ courseId: courseProgress.courseId, progress: courseProgress.progress }).from(courseProgress).where(eq(courseProgress.userId, userId)) : [];
  return Promise.all(rows.map(async roadmap => {
    const links = await db.select().from(roadmapCourses).where(eq(roadmapCourses.roadmapId, roadmap.id)).orderBy(roadmapCourses.orderIndex);
    const courseIds = links.map(link => link.courseId);
    const courseRows = courseIds.length ? await db.select({ id: courses.id, title: courses.title, category: courses.category }).from(courses).where(or(...courseIds.map(courseId => eq(courses.id, courseId)))) : [];
    return { ...roadmap, courses: links.map(link => ({ ...link, ...(courseRows.find(course => course.id === link.courseId) ?? {}), progress: progressRows.find(item => item.courseId === link.courseId)?.progress ?? 0 })) };
  }));
}

export async function listTracks(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(tracks).orderBy(desc(tracks.createdAt));
  const progressRows = userId ? await db.select({ courseId: courseProgress.courseId, progress: courseProgress.progress }).from(courseProgress).where(eq(courseProgress.userId, userId)) : [];
  return Promise.all(rows.map(async track => {
    const courseLinks = await db.select().from(trackCourses).where(eq(trackCourses.trackId, track.id)).orderBy(trackCourses.orderIndex);
    const toolLinks = await db.select().from(trackTools).where(eq(trackTools.trackId, track.id));
    const courseIds = courseLinks.map(link => link.courseId);
    const toolIds = toolLinks.map(link => link.toolId);
    const trackCoursesRows = courseIds.length ? await db.select({ id: courses.id, title: courses.title, category: courses.category, level: courses.level }).from(courses).where(or(...courseIds.map(courseId => eq(courses.id, courseId)))) : [];
    const trackToolsRows = toolIds.length ? await db.select({ id: tools.id, name: tools.name, category: tools.category }).from(tools).where(or(...toolIds.map(toolId => eq(tools.id, toolId)))) : [];
    const courseData = courseLinks.map(link => ({ ...(trackCoursesRows.find(course => course.id === link.courseId) ?? { id: link.courseId, title: "Unindexed course", category: "FIELD", level: "beginner" }), progress: progressRows.find(item => item.courseId === link.courseId)?.progress ?? 0 }));
    return { ...track, courses: courseData, tools: toolLinks.map(link => trackToolsRows.find(tool => tool.id === link.toolId)).filter(Boolean) };
  }));
}

export async function listCourses(search?: string) {
  const db = await getDb();
  if (!db) return [];
  const condition = search
    ? and(eq(courses.isPublished, true), or(like(courses.title, `%${search}%`), like(courses.category, `%${search}%`)))
    : eq(courses.isPublished, true);
  return db.select().from(courses).where(condition).orderBy(desc(courses.createdAt));
}

export async function listCves(search?: string, severity?: "critical" | "high" | "medium" | "low") {
  const db = await getDb();
  if (!db) return [];
  const filters = [];
  if (search) filters.push(or(like(cves.cveNumber, `%${search}%`), like(cves.title, `%${search}%`), like(cves.affected, `%${search}%`)));
  if (severity) filters.push(eq(cves.severity, severity));
  return db.select().from(cves).where(filters.length ? and(...filters) : undefined).orderBy(desc(cves.createdAt));
}

export async function listCvesPaginated(search?: string, severity?: "critical" | "high" | "medium" | "low", page = 1, pageSize = 12) {
  const db = await getDb();
  if (!db) return { items: [], total: 0, page, pageSize, totalPages: 0 };
  const filters = [];
  if (search) filters.push(or(like(cves.cveNumber, `%${search}%`), like(cves.title, `%${search}%`), like(cves.affected, `%${search}%`), like(cves.description, `%${search}%`)));
  if (severity) filters.push(eq(cves.severity, severity));
  const where = filters.length ? and(...filters) : undefined;
  const countRows = await db.select({ count: sql<number>`count(*)` }).from(cves).where(where);
  const total = Number(countRows[0]?.count ?? 0);
  const safePage = Math.max(1, page);
  const items = await db.select().from(cves).where(where).orderBy(desc(cves.publishedDate)).limit(pageSize).offset((safePage - 1) * pageSize);
  return { items, total, page: safePage, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function listTools(search?: string, category?: string, sort: "name" | "category" | "recent" = "name") {
  const db = await getDb();
  if (!db) return [];
  const filters = [];
  if (search) filters.push(or(like(tools.name, `%${search}%`), like(tools.description, `%${search}%`)));
  if (category && category !== "all") filters.push(eq(tools.category, category));
  const ordering = sort === "category" ? asc(tools.category) : sort === "recent" ? desc(tools.createdAt) : asc(tools.name);
  return db.select().from(tools).where(filters.length ? and(...filters) : undefined).orderBy(ordering);
}

export async function listBooksAdvanced(search?: string, category?: string, maxPoints?: number, sort: "title" | "price" | "recent" = "recent") {
  const db = await getDb();
  if (!db) return [];
  const filters = [];
  if (search) filters.push(or(like(books.title, `%${search}%`), like(books.author, `%${search}%`), like(books.description, `%${search}%`)));
  if (category && category !== "all") filters.push(eq(books.category, category));
  if (maxPoints !== undefined) filters.push(sql`${books.pricePoints} <= ${maxPoints}`);
  const ordering = sort === "title" ? asc(books.title) : sort === "price" ? asc(books.pricePoints) : desc(books.createdAt);
  return db.select().from(books).where(filters.length ? and(...filters) : undefined).orderBy(ordering);
}

export async function getTrackProgress(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const track = (await db.select().from(tracks).where(eq(tracks.id, trackId)).limit(1))[0];
  if (!track) return undefined;
  const links = await db.select().from(trackCourses).where(eq(trackCourses.trackId, trackId)).orderBy(trackCourses.orderIndex);
  const progressRows = await db.select().from(courseProgress).where(eq(courseProgress.userId, userId));
  const quiz = (await db.select().from(trackQuizzes).where(eq(trackQuizzes.trackId, trackId)).limit(1))[0];
  const questions = quiz ? await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quiz.id)).orderBy(quizQuestions.orderIndex) : [];
  const attempts = quiz ? await db.select().from(quizAttempts).where(and(eq(quizAttempts.quizId, quiz.id), eq(quizAttempts.userId, userId))).orderBy(desc(quizAttempts.createdAt)).limit(5) : [];
  const certificate = (await db.select().from(certificates).where(and(eq(certificates.trackId, trackId), eq(certificates.userId, userId))).limit(1))[0];
  const coursesData = await Promise.all(links.map(async link => ({ ...(await db.select().from(courses).where(eq(courses.id, link.courseId)).limit(1))[0], progress: progressRows.find(row => row.courseId === link.courseId)?.progress ?? 0 })));
  const averageProgress = coursesData.length ? Math.round(coursesData.reduce((sum, course) => sum + (course.progress ?? 0), 0) / coursesData.length) : 0;
  return { track, courses: coursesData, quiz: quiz ? { ...quiz, questions } : null, attempts, certificate, averageProgress };
}

export async function getTrackRoadmap(userId: number | undefined, trackId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const track = (await db.select().from(tracks).where(eq(tracks.id, trackId)).limit(1))[0];
  if (!track) return undefined;
  const levels = await db.select().from(trackLevels).where(eq(trackLevels.trackId, trackId)).orderBy(trackLevels.orderIndex);
  const userLevel = userId ? (await db.select().from(userTrackLevels).where(and(eq(userTrackLevels.userId, userId), eq(userTrackLevels.trackId, trackId))).limit(1))[0] : undefined;
  const completedLevels = new Set<number>(userLevel ? JSON.parse(userLevel.completedLevelsJson) : []);
  const levelData = await Promise.all(levels.map(async level => {
    const quiz = (await db.select().from(trackQuizzes).where(eq(trackQuizzes.trackLevelId, level.id)).limit(1))[0];
    const questions = quiz ? await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quiz.id)).orderBy(quizQuestions.orderIndex) : [];
    const certificate = userId ? (await db.select().from(certificates).where(and(eq(certificates.userId, userId), eq(certificates.trackLevelId, level.id))).limit(1))[0] : undefined;
    return { ...level, completed: completedLevels.has(level.orderIndex), active: (userLevel?.currentLevel ?? 1) === level.orderIndex, modules: await db.select().from(trackLevelModules).where(eq(trackLevelModules.trackLevelId, level.id)).orderBy(trackLevelModules.orderIndex), quiz: quiz ? { ...quiz, questions } : null, certificate: certificate ?? null };
  }));
  return { track, currentLevel: userLevel?.currentLevel ?? 1, levels: levelData };
}

export async function listMalware(search?: string, category?: string) {
  const db = await getDb();
  if (!db) return [];
  const filters = [];
  if (search) filters.push(or(like(malwareFamilies.name, `%${search}%`), like(malwareFamilies.description, `%${search}%`), like(malwareFamilies.mitreTechniques, `%${search}%`)));
  if (category && category !== "all") filters.push(eq(malwareFamilies.category, category));
  return db.select().from(malwareFamilies).where(filters.length ? and(...filters) : undefined).orderBy(desc(malwareFamilies.updatedAt));
}

export async function getPublicProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const user = await getUserById(userId);
  if (!user) return undefined;
  const [userPosts, track] = await Promise.all([
    db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt)),
    user.primaryTrackId ? db.select().from(tracks).where(eq(tracks.id, user.primaryTrackId)).limit(1) : [],
  ]);
  return { user, primaryTrack: track[0] ?? null, posts: userPosts };
}

export async function listPosts() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(30);
  return Promise.all(rows.map(async post => ({ ...post, author: (await getUserById(post.userId))?.name ?? "anonymous_node" })));
}

export async function listToolsAdvanced(search?: string, category?: string, sort: "name" | "category" | "recent" = "name") {
  return listTools(search, category, sort);
}

export async function listBooks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(books).orderBy(desc(books.createdAt));
}

export async function getCart(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const cart = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (!cart[0]) return [];
  const rows = await db.select().from(cartItems).where(eq(cartItems.cartId, cart[0].id));
  return Promise.all(rows.map(async item => ({ ...item, book: (await db.select().from(books).where(eq(books.id, item.bookId)).limit(1))[0] })));
}

export async function ensureCart(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(carts).values({ userId });
  const created = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  return created[0];
}

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { points: 640, coursesCompleted: 0, activeCourses: 0, cvesTracked: 0, followers: 0 };
  const user = await getUserById(userId);
  const [completed, active, cveCount, followerCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(courseProgress).where(and(eq(courseProgress.userId, userId), eq(courseProgress.completed, true))),
    db.select({ count: sql<number>`count(*)` }).from(courseProgress).where(and(eq(courseProgress.userId, userId), eq(courseProgress.completed, false))),
    db.select({ count: sql<number>`count(*)` }).from(cves),
    db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followingId, userId)),
  ]);
  return { points: user?.points ?? 640, coursesCompleted: Number(completed[0]?.count ?? 0), activeCourses: Number(active[0]?.count ?? 0), cvesTracked: Number(cveCount[0]?.count ?? 0), followers: Number(followerCount[0]?.count ?? 0) };
}

export { books, cartItems, carts, certificates, courseProgress, courses, cves, friendRequests, follows, malwareFamilies, notifications, nvdSyncRuns, nvdSyncSettings, postLikes, posts, quizAttempts, quizQuestions, roadmapCourses, roadmaps, tools, trackCourses, trackLevelModules, trackLevels, trackQuizzes, tracks, userTrackLevels, users };
