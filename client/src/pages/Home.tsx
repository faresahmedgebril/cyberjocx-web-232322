import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import {
  Activity, ArrowLeft, ArrowUpRight, BookOpen, Bot, Boxes, BrainCircuit, Bug, Check, ChevronLeft, CircleUserRound, Code2, Cpu, Database, FileCode2, Filter, Gauge, Heart, LayoutDashboard, Library, LockKeyhole, LogOut, Menu, MessageSquare, Network, Plus, Radio, Search, Send, Settings2, ShieldAlert, ShoppingBag, ShoppingCart, Sparkles, Terminal, Trophy, UserPlus, Users, Wrench, X, Zap, Target, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import FigmaDashboard from "@/components/FigmaDashboard";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import SettingsView from "@/features/settings/SettingsView";
import LeaderboardView from "@/features/leaderboard/LeaderboardView";
import NexusAssistantView from "@/features/ai/NexusAssistantView";

function safeExternalUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

type Section = "dashboard" | "profile" | "learning" | "tracks" | "cves" | "malware" | "tools" | "community" | "market" | "leaderboard" | "settings" | "ai" | "admin" | "instructor" | "ctf" | "labs";

function SectionIcon({ section }: { section: Section }) {
  const icons = { dashboard: LayoutDashboard, profile: CircleUserRound, learning: Library, tracks: Network, cves: ShieldAlert, malware: Bug, tools: Wrench, community: Users, market: ShoppingBag, leaderboard: Trophy, settings: Settings2, ai: Bot, admin: Gauge, instructor: BookOpen, ctf: Terminal, labs: Boxes };
  const Icon = icons[section];
  return <Icon size={17} strokeWidth={1.8} />;
}

export default function Home() {
  const { user, loading, error: authError, isAuthenticated, logout } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [cveSearch, setCveSearch] = useState("");
  const [severity, setSeverity] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [toolSearch, setToolSearch] = useState("");
  const [toolCategory, setToolCategory] = useState("all");
  const [toolSort, setToolSort] = useState<"name" | "category" | "recent">("name");
  const [bookSort, setBookSort] = useState<"title" | "price" | "recent">("recent");
  const [bookSearch, setBookSearch] = useState("");
  const [bookCategory, setBookCategory] = useState("all");
  const [bookMaxPoints, setBookMaxPoints] = useState("");
  const [cvePage, setCvePage] = useState(1);
  const [malwareSearch, setMalwareSearch] = useState("");
  const [malwareCategory, setMalwareCategory] = useState("all");
  const [postText, setPostText] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "assistant" | "user"; content: string }[]>([]);

  const courseInput = useMemo(() => ({ search: courseSearch || undefined }), [courseSearch]);
  const cveInput = useMemo(() => ({ search: cveSearch || undefined, severity: severity === "all" ? undefined : severity }), [cveSearch, severity]);
  const toolInput = useMemo(() => ({ search: toolSearch || undefined, category: toolCategory, sort: toolSort }), [toolSearch, toolCategory, toolSort]);
  const bookInput = useMemo(() => ({ search: bookSearch || undefined, category: bookCategory, maxPoints: bookMaxPoints ? Number(bookMaxPoints) : undefined, sort: bookSort }), [bookSearch, bookCategory, bookMaxPoints, bookSort]);
  const paginatedCveInput = useMemo(() => ({ search: cveSearch || undefined, severity: severity === "all" ? undefined : severity, page: cvePage, pageSize: 10 }), [cveSearch, severity, cvePage]);
  const dashboard = trpc.dashboard.useQuery(undefined, { enabled: isAuthenticated });
  const coursesQuery = trpc.courses.list.useQuery(courseInput);
  const roadmapsQuery = trpc.roadmaps.list.useQuery();
  const tracksQuery = trpc.tracks.list.useQuery();
  const cvesQuery = trpc.cves.list.useQuery(cveInput);
  const paginatedCvesQuery = trpc.cves.paginated.useQuery(paginatedCveInput);
  const toolsQuery = trpc.tools.advanced.useQuery(toolInput);
  const postsQuery = trpc.community.feed.useQuery();
  const friendRequestsQuery = trpc.community.friendRequests.useQuery(undefined, { enabled: isAuthenticated });
  const booksQuery = trpc.market.booksAdvanced.useQuery(bookInput);
  const cartQuery = trpc.market.cart.useQuery(undefined, { enabled: isAuthenticated });
  const notificationsQuery = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: isAuthenticated ? 30_000 : false, refetchOnWindowFocus: true });
  const nvdStatusQuery = trpc.nvd.status.useQuery();
  const malwareQuery = trpc.malware.list.useQuery({ search: malwareSearch || undefined, category: malwareCategory === "all" ? undefined : malwareCategory });
  const createPost = trpc.community.create.useMutation({ onSuccess: () => { setPostText(""); postsQuery.refetch(); toast.success("تم بث الإشارة إلى المجتمع"); } });
  const likePost = trpc.community.like.useMutation({ onSuccess: () => postsQuery.refetch() });
  const followUser = trpc.community.follow.useMutation({ onSuccess: data => toast.success(data.following ? "تمت المتابعة" : "تم إلغاء المتابعة") });
  const sendFriendRequest = trpc.community.sendFriendRequest.useMutation({ onSuccess: () => toast.success("تم إرسال طلب الصداقة") });
  const respondFriendRequest = trpc.community.respondFriendRequest.useMutation({ onSuccess: () => { friendRequestsQuery.refetch(); toast.success("تم تحديث طلب الصداقة"); } });
  const progressMutation = trpc.courses.progress.useMutation({ onSuccess: () => { dashboard.refetch(); toast.success("تم حفظ التقدم"); } });
  const addToCart = trpc.market.addToCart.useMutation({ onSuccess: () => { cartQuery.refetch(); toast.success("تمت إضافة العنصر إلى السلة"); } });
  const removeFromCart = trpc.market.removeFromCart.useMutation({ onSuccess: () => cartQuery.refetch() });
  const askAI = trpc.ai.ask.useMutation({ onSuccess: data => { setAiMessages(messages => [...messages, { role: "assistant", content: data.answer }]); }, onError: () => toast.error("تعذر الوصول إلى NEXUS الآن") });
  const markNotificationRead = trpc.notifications.markRead.useMutation({ onSuccess: () => notificationsQuery.refetch() });
  const markAllNotificationsRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => notificationsQuery.refetch() });

  const courses = coursesQuery.data ?? [];
  const cves = paginatedCvesQuery.data?.items ?? cvesQuery.data ?? [];
  const tools = toolsQuery.data ?? [];
  const cartCount = cartQuery.data?.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const unreadCount = notificationsQuery.data?.filter(item => !item.isRead).length ?? 0;
  const stats = { points: isAuthenticated ? (dashboard.data?.points ?? 0) : 0, coursesCompleted: dashboard.data?.coursesCompleted ?? 0, activeCourses: dashboard.data?.activeCourses ?? 0, cvesTracked: dashboard.data?.cvesTracked ?? cves.length, followers: dashboard.data?.followers ?? 0 };
  const syncError = authError || coursesQuery.error || cvesQuery.error || toolsQuery.error || postsQuery.error || booksQuery.error || roadmapsQuery.error || tracksQuery.error;

  const navItems: { id: Section; label: string; meta?: string }[] = [
    { id: "dashboard", label: "الرئيسية", meta: "01" },
    { id: "profile", label: "الملف الشخصي", meta: "ID" },
    { id: "learning", label: "الدورات", meta: "02" },
    { id: "tracks", label: "Tracks / Roadmaps", meta: "03" },
    { id: "cves", label: "مركز الثغرات CVE", meta: "04" },
    { id: "malware", label: "مركز Malware", meta: "05" },
    { id: "tools", label: "دليل الأدوات", meta: "04" },
    { id: "community", label: "المجتمع", meta: "05" },
    { id: "market", label: "السوق والكتب", meta: `${cartCount}` },
    { id: "leaderboard", label: "لوحة المتصدرين", meta: "XP" },
    { id: "ai", label: "NEXUS AI", meta: "AI" },
    { id: "settings", label: "الإعدادات", meta: "CFG" },
  ];
  if (user?.role === "instructor" || user?.role === "admin") navItems.push({ id: "instructor", label: "Instructor Studio", meta: "TEACH" });
  if (user?.role === "admin") navItems.push({ id: "admin", label: "غرفة المدير", meta: "A" });

  const navigate = (target: Section) => { setSection(target); setMobileOpen(false); };
  const figmaTargets: Record<string, Section> = { dashboard: "dashboard", profile: "profile", learning: "learning", tracks: "tracks", cves: "cves", malware: "malware", tools: "tools", community: "community", market: "market", leaderboard: "leaderboard", settings: "settings", ai: "ai", admin: "admin", instructor: "instructor", ctf: "ctf", labs: "labs" };
  const handleFigmaNavigate = (target: string) => { const destination = figmaTargets[target]; if (destination) navigate(destination); else toast.info(`${target} module is not available yet.`); };
  const titleMap: Record<Section, string> = { dashboard: "CYBERJOCX", profile: "YOUR PROFILE", learning: "مسارات التعلّم", tracks: "مساراتك التعليمية", cves: "مركز الثغرات CVE", malware: "مركز Malware", tools: "دليل الأدوات", community: "المجتمع", market: "مكتبة CyberJocx", leaderboard: "LEADERBOARD", settings: "SETTINGS", ai: "NEXUS", admin: "إدارة المنصة", instructor: "INSTRUCTOR STUDIO", ctf: "CTF ARENA", labs: "PRACTICE LABS" };

  if (loading) return (
    <div className="launch-loader" role="status" aria-live="polite">
      <div className="launch-loader__glow launch-loader__glow--one" aria-hidden="true" />
      <div className="launch-loader__glow launch-loader__glow--two" aria-hidden="true" />
      <div className="launch-loader__content">
        <div className="launch-loader__brand" aria-label="CyberJocx">
          <span>Cyber</span><strong>Jocx</strong>
        </div>
        <p className="launch-loader__message">بنجهّز مساحتك في CyberJocx</p>
        <div className="runner-scene" aria-hidden="true">
          <div className="runner-track"><span /></div>
          <div className="runner-runner">
            <svg viewBox="0 0 64 68" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="runner-head" cx="39" cy="9" r="6" />
              <path className="runner-body" d="M35 18L28 35" />
              <path className="runner-limb runner-arm runner-arm--back" d="M34 21L23 29L15 25" />
              <path className="runner-limb runner-arm runner-arm--front" d="M35 21L45 27L53 20" />
              <path className="runner-limb runner-leg runner-leg--back" d="M28 35L17 46L8 57" />
              <path className="runner-limb runner-leg runner-leg--front" d="M28 35L40 43L51 51" />
            </svg>
          </div>
          <div className="runner-scene__markers"><i /><i /><i /><i /><i /></div>
        </div>
        <div className="launch-loader__caption"><span /> جاري التحميل <span /></div>
      </div>
    </div>
  );

  const displayUserName = user?.name?.trim() || user?.email?.split("@")[0]?.trim() || (isAuthenticated ? "GHOST_OPERATOR" : "Guest");
  const pageContent = section === "dashboard" ? undefined : (
    <section className="cj-dashboard-page-content">
      <header className="cj-dashboard-page-heading">
        <div><span>// CYBERJOCX CONTROL SURFACE</span><h1>{titleMap[section]}</h1><p>كل أدوات التعلم والممارسة وإدارة حسابك في مساحة واحدة.</p></div>
      </header>
      {syncError && <div className="system-alert"><ShieldAlert size={15} /><span>{authError ? "AUTH WARNING // تعذر إكمال جلسة الدخول. سجّل الدخول مرة أخرى أو أنشئ حسابًا جديدًا." : "SYNC WARNING // تعذر مزامنة بعض البيانات. حاول التحديث مرة أخرى."}</span></div>}
      {section === "profile" && <ProfileView user={user} />}
      {section === "learning" && <LearningView courses={courses} roadmaps={roadmapsQuery.data ?? []} tracks={tracksQuery.data ?? []} loading={coursesQuery.isLoading || roadmapsQuery.isLoading || tracksQuery.isLoading} error={coursesQuery.error || roadmapsQuery.error || tracksQuery.error} search={courseSearch} setSearch={setCourseSearch} onStart={course => isAuthenticated ? progressMutation.mutate({ courseId: course.id, progress: 10 }) : startLogin()} />}
      {section === "tracks" && <TracksView tracks={tracksQuery.data ?? []} loading={tracksQuery.isLoading} error={tracksQuery.error} />}
      {section === "cves" && <CvesView cves={cves} loading={cvesQuery.isLoading || paginatedCvesQuery.isLoading} error={cvesQuery.error || paginatedCvesQuery.error} search={cveSearch} setSearch={value => { setCveSearch(value); setCvePage(1); }} severity={severity} setSeverity={value => { setSeverity(value); setCvePage(1); }} page={cvePage} totalPages={paginatedCvesQuery.data?.totalPages ?? 0} onPage={setCvePage} lastUpdated={nvdStatusQuery.data?.lastCompletedAt ? new Date(nvdStatusQuery.data.lastCompletedAt).toLocaleString("ar-EG") : nvdStatusQuery.data?.lastStatus ?? "لم تبدأ بعد"} />}
      {section === "malware" && <MalwareView items={malwareQuery.data ?? []} loading={malwareQuery.isLoading} error={malwareQuery.error} search={malwareSearch} setSearch={setMalwareSearch} category={malwareCategory} setCategory={setMalwareCategory} />}
      {section === "tools" && <ToolsView tools={tools} loading={toolsQuery.isLoading} error={toolsQuery.error} search={toolSearch} setSearch={setToolSearch} category={toolCategory} setCategory={setToolCategory} sort={toolSort} setSort={setToolSort} />}
      {section === "community" && <CommunityView posts={postsQuery.data ?? []} requests={friendRequestsQuery.data ?? []} loading={postsQuery.isLoading} error={postsQuery.error} postText={postText} setPostText={setPostText} onPost={() => isAuthenticated ? createPost.mutate({ content: postText }) : startLogin()} onLike={postId => isAuthenticated ? likePost.mutate({ postId }) : startLogin()} onFollow={userId => isAuthenticated ? followUser.mutate({ userId }) : startLogin()} onFriend={userId => isAuthenticated ? sendFriendRequest.mutate({ userId }) : startLogin()} onRespond={(requestId, accept) => respondFriendRequest.mutate({ requestId, accept })} />}
      {section === "market" && <MarketView books={booksQuery.data ?? []} loading={booksQuery.isLoading} error={booksQuery.error} cartItems={cartQuery.data ?? []} cartCount={cartCount} onAdd={bookId => isAuthenticated ? addToCart.mutate({ bookId }) : startLogin()} onRemove={itemId => removeFromCart.mutate({ itemId })} search={bookSearch} setSearch={setBookSearch} category={bookCategory} setCategory={setBookCategory} maxPoints={bookMaxPoints} setMaxPoints={setBookMaxPoints} sort={bookSort} setSort={setBookSort} />}
      {section === "leaderboard" && <LeaderboardView stats={{ points: isAuthenticated ? stats.points : null, coursesCompleted: isAuthenticated ? stats.coursesCompleted : null, cvesTracked: isAuthenticated ? (stats.cvesTracked || cves.length) : null }} userName={displayUserName} onSignIn={() => isAuthenticated ? navigate("profile") : startLogin()} />}
      {section === "settings" && <SettingsView user={user} isAuthenticated={isAuthenticated} onOpenProfile={() => navigate("profile")} />}
      {section === "ai" && <NexusAssistantView messages={aiMessages} input={aiInput} setInput={setAiInput} onAsk={() => { const message = aiInput.trim(); if (!message || !isAuthenticated || askAI.isPending) return; setAiMessages(messages => [...messages, { role: "user", content: message }]); askAI.mutate({ message, history: aiMessages.slice(-12) }); setAiInput(""); }} onNewChat={() => { setAiMessages([]); setAiInput(""); }} isLoading={askAI.isPending} isAuthenticated={isAuthenticated} onSignIn={startLogin} />}
      {section === "admin" && (user?.role === "admin" ? <><AdminView /><AdminWorkflowPanel /></> : <ModuleState title="لوحة الإدارة مخصصة لحساب المدير فقط." error />)}
      {section === "instructor" && (user?.role === "instructor" || user?.role === "admin" ? <InstructorView /> : <ModuleState title="مساحة المدرّس مخصصة للحسابات المعتمدة فقط." error />)}
      {section === "ctf" && <CtfView isAuthenticated={isAuthenticated} onSignIn={startLogin} />}
      {section === "labs" && <LabsView isAuthenticated={isAuthenticated} onSignIn={startLogin} />}
    </section>
  );

  return (
    <FigmaDashboard
      stats={{ points: stats.points, coursesCompleted: stats.coursesCompleted, activeCourses: stats.activeCourses, cvesTracked: stats.cvesTracked || cves.length }}
      learningCourses={courses.map((course: any) => ({ id: course.id, title: course.title, category: course.category, level: course.level, progress: course.progress, availabilityStatus: course.availabilityStatus }))}
      userName={displayUserName}
      userAvatarUrl={user?.avatarUrl ?? null}
      userRole={user?.role ?? null}
      activePage={({ dashboard: "Home", profile: "Profile", learning: "Courses", tracks: "Roadmap", cves: "CVE Center", malware: "Malware", tools: "Labs", community: "Community", market: "Market", leaderboard: "Leaderboard", settings: "Settings", ai: "AI Assistant", admin: "Admin Console", instructor: "Instructor Studio", ctf: "CTF", labs: "Labs" } satisfies Record<Section, string>)[section]}
      pageContent={pageContent}
      notifications={notificationsQuery.data ?? []}
      onNotificationRead={id => markNotificationRead.mutate({ id })}
      onNotificationReadAll={() => markAllNotificationsRead.mutate()}
      onNavigate={handleFigmaNavigate}
      onOpenAuth={() => isAuthenticated ? navigate("profile") : startLogin()}
      onLogout={() => { void logout(); }}
    />
  );
}


function ModuleState({ title, error, empty = false }: { title: string; error?: unknown; empty?: boolean }) {
  return <div className="empty-state panel-card"><Activity size={27} /><h3>{error ? "Signal unavailable" : empty ? "No nodes indexed" : "Syncing matrix..."}</h3><p>{error ? "تعذر الوصول إلى قاعدة البيانات. تحقق من الاتصال وحاول مرة أخرى." : empty ? title : "جارٍ تحميل البيانات الدائمة من طبقة المعرفة..."}</p></div>;
}

function ProfileView({ user }: { user: any }) {
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl ?? "");
  const [rank, setRank] = useState(user?.memberRank ?? "learner");
  const [primaryTrackId, setPrimaryTrackId] = useState(String(user?.primaryTrackId ?? ""));
  const tracks = trpc.tracks.list.useQuery();
  const profile = trpc.profile.byId.useQuery({ userId: user?.id ?? 0 }, { enabled: Boolean(user?.id) });
  const friends = trpc.community.friends.useQuery(undefined, { enabled: Boolean(user?.id) });
  const updateProfile = trpc.profile.update.useMutation({ onSuccess: () => { profile.refetch(); toast.success("تم حفظ ملفك الشخصي"); } });
  const uploadMedia = trpc.profile.uploadMedia.useMutation({ onSuccess: (data, variables) => { if (variables.kind === "avatar") setAvatarUrl(data.url); else setBannerUrl(data.url); toast.success("تم رفع الصورة بنجاح"); } });
  const pickMedia = (kind: "avatar" | "banner", file?: File) => { if (!file) return; if (!file.type.startsWith("image/")) return toast.error("اختر ملف صورة صالحًا."); const reader = new FileReader(); reader.onload = () => uploadMedia.mutate({ kind, dataUrl: String(reader.result) }); reader.readAsDataURL(file); };
  const posts = profile.data?.posts ?? [];
  return <section className="profile-layout"><div className="profile-card panel-card"><div className="profile-cover" style={bannerUrl ? { backgroundImage: `linear-gradient(90deg, rgba(3,10,14,.55), rgba(45,11,59,.45)), url(${bannerUrl})` } : undefined}><div className="profile-scan" /><label className="media-upload banner-upload">تغيير البانر <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => pickMedia("banner", event.target.files?.[0])} /></label></div><div className="profile-body"><div className="profile-identity"><div className="profile-avatar avatar-photo">{avatarUrl ? <img src={avatarUrl} alt="صورة الحساب" /> : name?.[0] ?? "G"}<label className="media-upload avatar-upload"><Plus size={14} /><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => pickMedia("avatar", event.target.files?.[0])} /></label></div><div><div className="section-tag">// YOUR IDENTITY</div><h2>{name || "GHOST_OPERATOR"}</h2><span>{user?.email ?? "البريد غير متاح"} · {rank.toUpperCase()}</span></div></div><div className="profile-stats"><div><strong>{user?.points ?? 0}</strong><span>XP POINTS</span></div><div><strong>{rank.toUpperCase()}</strong><span>MEMBER RANK</span></div><div><strong>{posts.length}</strong><span>POSTS</span></div></div></div></div><div className="profile-editor panel-card"><div className="section-tag">// EDIT YOUR PROFILE</div><h3>رتّب هويتك وسجلّك المهني.</h3><p className="profile-helper">البريد والهاتف وLinkedIn بيانات خاصة لحسابك ولا تظهر في الملف العام تلقائيًا.</p><div className="profile-form-grid"><label className="admin-field"><span>الاسم المعروض</span><input value={name} onChange={event => setName(event.target.value)} placeholder="اسمك داخل CyberJocx" /></label><label className="admin-field"><span>الهاتف</span><input value={phone} onChange={event => setPhone(event.target.value)} placeholder="01xxxxxxxxx" /></label><label className="admin-field"><span>LinkedIn URL</span><input value={linkedinUrl} onChange={event => setLinkedinUrl(event.target.value)} placeholder="https://linkedin.com/in/..." /></label><label className="admin-field"><span>التصنيف</span><select value={rank} onChange={event => setRank(event.target.value)}><option value="learner">Learner</option><option value="contributor">Contributor</option><option value="analyst">Analyst</option><option value="mentor">Mentor</option><option value="elite">Elite</option></select></label><label className="admin-field"><span>المسار الأساسي</span><select value={primaryTrackId} onChange={event => setPrimaryTrackId(event.target.value)}><option value="">اختر مسارك</option>{tracks.data?.map(track => <option key={track.id} value={track.id}>{track.title}</option>)}</select></label><label className="admin-field full"><span>نبذة شخصية</span><textarea value={bio} onChange={event => setBio(event.target.value)} placeholder="اكتب ما تتعلمه وما المجال الذي تبني فيه خبرتك..." /></label></div><button className="primary-button" onClick={() => updateProfile.mutate({ name, bio, avatarUrl: avatarUrl || undefined, bannerUrl: bannerUrl || undefined, phone: phone || undefined, linkedinUrl: linkedinUrl || undefined, memberRank: rank as "learner" | "contributor" | "analyst" | "mentor" | "elite", primaryTrackId: primaryTrackId ? Number(primaryTrackId) : undefined })} disabled={updateProfile.isPending || uploadMedia.isPending}><Check size={15} /> حفظ الملف</button></div><div className="profile-posts panel-card"><div className="card-head"><div><div className="section-tag">// YOUR POSTS</div><h3>منشوراتك داخل المجتمع</h3></div><span>{posts.length} POSTS</span></div>{posts.length ? posts.map((post: any) => <article className="profile-post" key={post.id}><p>{post.content}</p><span>{new Date(post.createdAt).toLocaleDateString("ar-EG")} · {post.likesCount} إعجاب</span></article>) : <div className="empty-state"><MessageSquare size={21} /><p>لم تنشر أي إشارة بعد. ابدأ من صفحة المجتمع.</p></div>}</div><div className="profile-friends panel-card"><div className="card-head"><div><div className="section-tag">// YOUR CIRCLE</div><h3>الأصدقاء</h3></div><span>{friends.data?.length ?? 0} FRIENDS</span></div>{friends.data?.length ? <div className="friend-grid">{friends.data.map(friend => <div className="friend-card" key={friend.id}>{friend.avatarUrl ? <img src={friend.avatarUrl} alt="" /> : <span>{friend.name?.[0] ?? "C"}</span>}<div><strong>{friend.name ?? "عضو CyberJocx"}</strong><small>{friend.memberRank ?? "learner"}</small></div></div>)}</div> : <div className="empty-state"><Users size={21} /><p>لا يوجد أصدقاء بعد. أرسل طلبًا من صفحة المجتمع.</p></div>}</div></section>;
}

function LearningView({ courses, roadmaps, tracks, loading, error, search, setSearch, onStart }: { courses: any[]; roadmaps: any[]; tracks: any[]; loading: boolean; error?: unknown; search: string; setSearch: (value: string) => void; onStart: (course: any) => void }) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [roadmapTrackId, setRoadmapTrackId] = useState<number | null>(null);
  const [personalRoadmap, setPersonalRoadmap] = useState("");
  const [openLevelQuizId, setOpenLevelQuizId] = useState<number | null>(null);
  const [levelQuizAnswers, setLevelQuizAnswers] = useState<Record<number, number[]>>({});
  const courseInput = useMemo(() => ({ id: selectedCourseId ?? 0 }), [selectedCourseId]);
  const courseDetail = trpc.courses.byId.useQuery(courseInput, { enabled: selectedCourseId !== null });
  const roadmapDetail = trpc.tracks.roadmap.useQuery({ trackId: roadmapTrackId ?? 0 }, { enabled: roadmapTrackId !== null });
  const personalizeRoadmap = trpc.ai.personalizeRoadmap.useMutation({ onSuccess: data => setPersonalRoadmap(data.roadmap), onError: error => toast.error(error.message || "سجل دخولك لتخصيص roadmap.") });
  const submitLevelQuiz = trpc.tracks.submitQuiz.useMutation({ onSuccess: result => { roadmapDetail.refetch(); toast.success(result.passed ? `أحسنت، صدرت شهادتك: ${result.certificateCode}` : `النتيجة ${result.score}%، راجع المتطلبات وحاول مجددًا.`); } });
  if (loading) return <ModuleState title="جارٍ مزامنة مسارات التعلم..." />;
  if (error) return <ModuleState title="تعذر تحميل مسارات التعلم." error={error} />;
  if (!courses.length) return <section className="module-stack">
    <div className="learning-banner panel-card course-empty-catalog">
      <div>
        <div className="section-tag">// CYBERJOCX COURSE CATALOG</div>
        <span className="course-coming-soon-pill">COMING SOON</span>
        <h2>الدورات قيد التجهيز</h2>
        <p>بنجهّز محتوى الدورات والدروس والتطبيقات العملية. هتظهر هنا بعد اعتمادها من إدارة CyberJocx.</p>
      </div>
      <div className="roadmap-steps">
        <span className="active">01 / CONTENT PREPARATION</span>
        <span>02 / OWNER APPROVAL</span>
        <span>03 / COURSE LAUNCH</span>
      </div>
    </div>
  </section>;
  const trackForCourse = selectedCourseId ? tracks.find(track => track.courses?.some((course: any) => course.id === selectedCourseId)) : undefined;
  return <section className="module-stack"><div className="module-toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث في المسارات..." /></div><span className="result-count">{courses.length} NODES FOUND</span></div><div className="learning-banner panel-card"><div><div className="section-tag">// CAREER ROADMAPS</div><h2>{roadmaps[0]?.title ?? "Build your operator path."}</h2><p>اضغط على أي دورة لمشاهدة roadmap كامل للمسار، ومستويات الخبرة، ومتطلبات العبور.</p></div><div className="roadmap-steps">{roadmaps[0]?.courses?.length ? roadmaps[0].courses.slice(0, 3).map((course: any, index: number) => <span key={course.id} className={course.progress >= 100 ? "done" : index === 0 ? "active" : ""}>{`0${index + 1}`} / {course.title} <b>{course.progress}%</b></span>) : <span>01 / ROADMAP EMPTY</span>}</div></div><div className="course-cards">{courses.map((course, index) => <article className="course-card panel-card" key={course.id} onClick={() => setSelectedCourseId(course.id)} onKeyDown={event => event.key === "Enter" && setSelectedCourseId(course.id)} role="button" tabIndex={0}><div className={`course-art art-${(index % 3) + 1}`}><span className="art-code">{`0${index + 1}`}</span><span className="course-coming-soon-badge">COMING SOON</span><div className="art-grid" /><div className="art-icon">{index === 0 ? <Code2 size={34} /> : index === 1 ? <Network size={34} /> : <BrainCircuit size={34} />}</div></div><div className="course-card-content"><div className="course-row-meta">{course.category} <span>•</span> {course.level}</div><h3>{course.title}</h3><p>{course.description}</p><div className="course-card-foot"><span><BookOpen size={14} /> {course.lessons} lessons</span><span><Activity size={14} /> {Math.round(course.durationMinutes / 60)}h</span><button className="small-button" type="button" disabled={course.availabilityStatus === "coming-soon"} onClick={event => { event.stopPropagation(); if (course.availabilityStatus !== "coming-soon") onStart(course); }}>{course.availabilityStatus === "coming-soon" ? "COMING SOON" : <>START NODE <ArrowUpRight size={13} /></>}</button></div></div></article>)}</div>{selectedCourseId !== null && <div className="modal-backdrop" onClick={() => setSelectedCourseId(null)}><div className="detail-modal panel-card" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedCourseId(null)}><X size={16} /></button><div className="section-tag">// COURSE NODE {courseDetail.isLoading ? "SYNCING" : "LOADED"}</div><h2>{courseDetail.data?.title ?? "Course detail"}</h2><p>{courseDetail.data?.description ?? "جارٍ تحميل تفاصيل عقدة التعلم..."}</p><div className="detail-meta"><span className="course-coming-soon-pill">COMING SOON</span><span>{courseDetail.data?.category ?? "LEARNING"}</span><span>{courseDetail.data?.level ?? "FIELD"}</span><span>{courseDetail.data?.lessons ?? "--"} lessons</span></div><div className="modal-actions"><button className="primary-button" type="button" disabled={(courseDetail.data ?? courses.find(item => item.id === selectedCourseId))?.availabilityStatus === "coming-soon"} onClick={() => { const course = courseDetail.data ?? courses.find(item => item.id === selectedCourseId); if (course && course.availabilityStatus !== "coming-soon") onStart(course); }}>{(courseDetail.data ?? courses.find(item => item.id === selectedCourseId))?.availabilityStatus === "coming-soon" ? "COMING SOON" : <><Zap size={15} /> ابدأ الدورة</>}</button>{trackForCourse && <button className="small-button" onClick={() => { setPersonalRoadmap(""); setRoadmapTrackId(trackForCourse.id); }}>عرض Roadmap المسار <ArrowUpRight size={13} /></button>}</div></div></div>}{roadmapTrackId !== null && <div className="modal-backdrop" onClick={() => setRoadmapTrackId(null)}><div className="detail-modal panel-card roadmap-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setRoadmapTrackId(null)}><X size={16} /></button><div className="section-tag">// FULL TRACK ROADMAP</div><h2>{roadmapDetail.data?.track.title ?? "جارٍ تحميل المسار"}</h2><p>خطة واضحة من المبتدئ حتى الاحتراف. أكمل متطلبات المستوى واختباره لتحصل على شهادته.</p><button className="secondary-button" disabled={personalizeRoadmap.isPending} onClick={() => personalizeRoadmap.mutate({ trackId: roadmapTrackId })}><Bot size={15} /> {personalizeRoadmap.isPending ? "NEXUS يجهز الخطة..." : "خصص الخطة مع NEXUS"}</button>{personalRoadmap && <div className="nexus-roadmap panel-card"><div className="section-tag">// NEXUS PERSONAL PLAN</div><Streamdown>{personalRoadmap}</Streamdown></div>}<div className="level-roadmap">{roadmapDetail.data?.levels.map((level: any) => <article key={level.id} className={`level-node ${level.active ? "active" : ""} ${level.completed ? "completed" : ""}`}><div className="level-node-head"><b>{String(level.orderIndex).padStart(2, "0")}</b><div><h3>{level.title}</h3><span>{level.certificateName}</span></div>{level.completed && <Check size={17} />}</div><p>{level.description}</p><div className="level-requirements"><strong>للتجاوز:</strong> {level.requirements}</div>{level.modules.map((module: any) => <div className="video-module" key={module.id}><div><strong>{module.title}</strong><p>{module.description}</p><small>{module.actionItems}</small></div>{module.videoUrl && <a href={module.videoUrl} target="_blank" rel="noreferrer" className="small-button"><Activity size={13} /> شاهد الفيديو</a>}</div>)}{level.quiz && <div className="level-quiz"><button className="small-button" onClick={() => setOpenLevelQuizId(openLevelQuizId === level.quiz.id ? null : level.quiz.id)}>{level.certificate ? "عرض شهادتك" : "اختبار المستوى"} <Check size={13} /></button>{openLevelQuizId === level.quiz.id && <div className="quiz-panel"><h3>{level.quiz.title}</h3>{level.quiz.questions.map((question: any, index: number) => <fieldset key={question.id}><legend>{index + 1}. {question.prompt}</legend>{JSON.parse(question.optionsJson).map((option: string, optionIndex: number) => <label key={option}><input type="radio" name={`level-${level.quiz.id}-${question.id}`} checked={(levelQuizAnswers[level.quiz.id] ?? [])[index] === optionIndex} onChange={() => setLevelQuizAnswers(current => ({ ...current, [level.quiz.id]: (() => { const next = [...(current[level.quiz.id] ?? [])]; next[index] = optionIndex; return next; })() }))} /> {option}</label>)}</fieldset>)}<button className="primary-button compact" disabled={submitLevelQuiz.isPending || (levelQuizAnswers[level.quiz.id] ?? []).length !== level.quiz.questions.length} onClick={() => submitLevelQuiz.mutate({ quizId: level.quiz.id, answers: levelQuizAnswers[level.quiz.id] ?? [] })}>إرسال الإجابات</button>{level.certificate && <div className="certificate-card"><Check size={18} /><div><strong>شهادة المستوى صادرة</strong><span>{level.certificate.certificateCode}</span></div></div>}</div>}</div>}</article>)}</div></div></div>}</section>;
}

function TracksView({ tracks, loading, error }: { tracks: any[]; loading: boolean; error?: unknown }) {
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const detail = trpc.tracks.progress.useQuery({ trackId: selectedTrackId ?? 0 }, { enabled: selectedTrackId !== null });
  const submitQuiz = trpc.tracks.submitQuiz.useMutation({ onSuccess: result => { detail.refetch(); toast.success(result.passed ? `نجحت في الاختبار — الشهادة ${result.certificateCode ?? "جاهزة"}` : `النتيجة ${result.score}% — راجع الدروس وحاول مرة أخرى`); } });
  if (loading) return <ModuleState title="جارٍ مزامنة الـtracks والـroadmaps..." />;
  if (error) return <ModuleState title="تعذر تحميل الـtracks." error={error} />;
  if (!tracks.length) return <ModuleState title="لم تتم إضافة أي track بعد." empty />;
  return <section className="module-stack"><div className="learning-banner panel-card"><div><div className="section-tag">// OPERATOR ROADMAP</div><h2>اختر طريقك داخل النظام.</h2><p>كل track يوضح المهارات، الدورات، الأدوات، ونسبة تقدمك حتى الشهادة.</p></div><div className="roadmap-steps"><span className="active">01 / SELECT TRACK</span><span>02 / COMPLETE NODES</span><span>03 / EARN CERTIFICATE</span></div></div><div className="track-grid">{tracks.map((track: any) => { const progress = track.courses?.length ? Math.round(track.courses.reduce((sum: number, course: any) => sum + course.progress, 0) / track.courses.length) : 0; return <article className="track-card panel-card" key={track.id}><div className="section-tag">// {track.slug}</div><h3>{track.title}</h3><p>{track.description}</p><div className="track-progress"><div><span>TRACK PROGRESS</span><b>{progress}%</b></div><i><em style={{ width: `${progress}%` }} /></i></div><div className="track-course-list">{track.courses?.map((course: any, index: number) => <div className="track-course-row" key={course.id}><span>{`0${index + 1}`}</span><strong>{course.title}</strong><b>{course.progress}%</b></div>)}</div><div className="track-tools">{track.tools?.slice(0, 5).map((tool: any) => <span key={tool.id}>{tool.name}</span>)}</div><div className="track-outcome"><span>OUTCOME</span><p>{track.outcome}</p></div><button className="primary-button compact" onClick={() => { setSelectedTrackId(track.id); setAnswers([]); }}>OPEN PROGRESS CONSOLE <ArrowUpRight size={13} /></button></article>; })}</div>{selectedTrackId !== null && <div className="modal-backdrop" onClick={() => setSelectedTrackId(null)}><div className="detail-modal panel-card track-detail-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedTrackId(null)}><X size={16} /></button><div className="section-tag">// PROGRESS CONSOLE {detail.isLoading ? "SYNCING" : "LIVE"}</div><h2>{detail.data?.track.title ?? "Track dashboard"}</h2><p>{detail.data?.track.description ?? "جارٍ تحميل خطة المسار..."}</p><div className="detail-progress-hero"><strong>{detail.data?.averageProgress ?? 0}%</strong><span>متوسط إتمام المسار</span></div><div className="progress-milestones">{detail.data?.courses?.map((course: any, index: number) => <div key={course.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{course.title}</strong><small>{course.progress}% مكتمل</small></div><i><em style={{ width: `${course.progress}%` }} /></i></div>)}</div>{detail.data?.quiz ? <div className="quiz-panel"><div className="section-tag">// KNOWLEDGE CHECK // PASS {detail.data!.quiz!.passingScore}%</div><h3>{detail.data!.quiz!.title}</h3>{detail.data!.quiz!.questions.map((question: any, index: number) => <fieldset key={question.id}><legend>{index + 1}. {question.prompt}</legend>{JSON.parse(question.optionsJson).map((option: string, optionIndex: number) => <label key={option}><input type="radio" name={`q-${question.id}`} checked={answers[index] === optionIndex} onChange={() => setAnswers(current => { const next = [...current]; next[index] = optionIndex; return next; })} /> {option}</label>)}</fieldset>)}<button className="primary-button" disabled={answers.length !== detail.data!.quiz!.questions.length || submitQuiz.isPending} onClick={() => submitQuiz.mutate({ quizId: detail.data!.quiz!.id, answers })}><Check size={15} /> SUBMIT ASSESSMENT</button>{detail.data.attempts?.[0] && <span className="quiz-last-result">آخر نتيجة: {detail.data.attempts[0].score}%</span>}</div> : <div className="empty-state"><BrainCircuit size={22} /><p>لم تتم إضافة اختبار لهذا المسار بعد.</p></div>}{detail.data?.certificate && <div className="certificate-card"><Check size={20} /><div><strong>شهادة إتمام صادرة</strong><span>{detail.data.certificate.certificateCode} · {new Date(detail.data.certificate.issuedAt).toLocaleDateString("ar-EG")}</span></div></div>}</div></div>}</section>;
}

function CvesView({ cves, loading, error, search, setSearch, severity, setSeverity, page, totalPages, onPage, lastUpdated }: { cves: any[]; loading: boolean; error?: unknown; search: string; setSearch: (value: string) => void; severity: string; setSeverity: (value: any) => void; page: number; totalPages: number; onPage: (value: number) => void; lastUpdated?: string }) {
  const [selectedCveId, setSelectedCveId] = useState<number | null>(null);
  const cveInput = useMemo(() => ({ id: selectedCveId ?? 0 }), [selectedCveId]);
  const cveDetail = trpc.cves.byId.useQuery(cveInput, { enabled: selectedCveId !== null });
  if (loading) return <ModuleState title="جارٍ مزامنة مركز CVE..." />;
  if (error) return <ModuleState title="تعذر تحميل إشارات CVE." error={error} />;
  if (!cves.length) return <ModuleState title="لم تتم فهرسة أي CVE بعد." empty />;
  return <section className="module-stack"><div className="module-toolbar"><div className="search-box wide"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث برقم CVE أو المنتج أو العنوان..." /></div><div className="filter-tabs"><Filter size={15} />{["all", "critical", "high", "medium", "low"].map(value => <button key={value} className={severity === value ? "active" : ""} onClick={() => setSeverity(value)}>{value.toUpperCase()}</button>)}</div><div className="sync-meta">NVD SYNC {lastUpdated ?? "DAILY"}</div></div><div className="intel-banner panel-card"><div className="intel-glyph"><Bug size={28} /></div><div><div className="section-tag">// CVE INTELLIGENCE TERMINAL</div><h2>Know the weakness before it knows you.</h2><p>قاعدة بحث موحدة لإشارات الثغرات. فلتر حسب الخطورة وتحقق من المصدر قبل اتخاذ أي إجراء.</p></div><div className="intel-stat"><strong>{cves.length}</strong><span>signals indexed</span></div></div><div className="cve-table panel-card"><div className="table-head"><span>IDENTIFIER</span><span>THREAT VECTOR</span><span>SEVERITY</span><span>CVSS</span><span>DATE</span><span /></div>{cves.map(cve => <div className="table-row" key={cve.id} onClick={() => setSelectedCveId(cve.id)} role="button" tabIndex={0} onKeyDown={event => event.key === "Enter" && setSelectedCveId(cve.id)}><div className="cve-id"><span className={`severity-dot ${cve.severity}`} /><strong>{cve.cveNumber}</strong></div><div><strong>{cve.title}</strong><span>{cve.affected}</span></div><div><span className={`severity-pill ${cve.severity}`}>{cve.severity.toUpperCase()}</span></div><div className="cvss-score">{cve.cvss}</div><div className="muted-cell">{cve.publishedDate}</div><a href={safeExternalUrl(cve.sourceUrl) ?? "https://nvd.nist.gov/"} target="_blank" rel="noopener noreferrer" className="row-link" onClick={event => event.stopPropagation()}><ArrowUpRight size={15} /></a></div>)}</div><div className="pagination-bar"><span>PAGE {page} / {Math.max(totalPages, 1)}</span><button className="small-button" disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 1))}>PREV</button><button className="small-button" disabled={!totalPages || page >= totalPages} onClick={() => onPage(Math.min(totalPages, page + 1))}>NEXT</button></div>{selectedCveId !== null && <div className="modal-backdrop" onClick={() => setSelectedCveId(null)}><div className="detail-modal panel-card cve-detail" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedCveId(null)}><X size={16} /></button><div className="section-tag">// CVE INTELLIGENCE {cveDetail.isLoading ? "SYNCING" : "LOADED"}</div><div className="cve-detail-id"><span className={`severity-dot ${cveDetail.data?.severity ?? "high"}`} /><span>{cveDetail.data?.cveNumber ?? "CVE SIGNAL"}</span><b>{cveDetail.data?.cvss ?? "--"} CVSS</b></div><h2>{cveDetail.data?.title ?? "Loading signal..."}</h2><p>{cveDetail.data?.description ?? "جارٍ تحميل تفاصيل الإشارة..."}</p><div className="detail-meta"><span>AFFECTED: {cveDetail.data?.affected ?? "--"}</span><span>PUBLISHED: {cveDetail.data?.publishedDate ?? "--"}</span></div><a className="primary-button" href={safeExternalUrl(cveDetail.data?.sourceUrl) ?? "https://nvd.nist.gov/"} target="_blank" rel="noopener noreferrer">VERIFY SOURCE <ArrowUpRight size={15} /></a></div></div>}</section>;
}

function ToolsView({ tools, loading, error, search, setSearch, category, setCategory, sort, setSort }: { tools: any[]; loading: boolean; error?: unknown; search: string; setSearch: (value: string) => void; category: string; setCategory: (value: string) => void; sort: "name" | "category" | "recent"; setSort: (value: "name" | "category" | "recent") => void }) {
  const [comingOpen, setComingOpen] = useState(false);
  if (loading) return <ModuleState title="جارٍ مزامنة دليل الأدوات..." />;
  if (error) return <ModuleState title="تعذر تحميل دليل الأدوات." error={error} />;
  if (!tools.length) return <ModuleState title="لم تتم فهرسة أي أداة بعد." empty />;
  const categories = ["all", ...Array.from(new Set(tools.map(tool => tool.category)))];
  return <section className="module-stack"><div className="module-toolbar"><div className="search-box wide"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث في toolkit..." /></div><div className="filter-tabs"><Boxes size={15} />{categories.slice(0, 5).map(value => <button key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)}>{value.toUpperCase()}</button>)}</div><select className="sort-select" value={sort} onChange={event => setSort(event.target.value as "name" | "category" | "recent")}><option value="name">SORT: NAME</option><option value="category">SORT: CATEGORY</option><option value="recent">SORT: RECENT</option></select></div><div className="tools-grid">{tools.map((tool, index) => <article className="tool-card panel-card" key={tool.id}><div className="tool-card-top"><div className={`tool-icon tool-${index % 4}`}><Terminal size={20} /></div><span className="tool-category">{tool.category}</span></div><h3>{tool.name}</h3><p>{tool.description}</p><div className="command-line"><span>$</span>{tool.commands ?? "secure-tool --help"}</div>{safeExternalUrl(tool.downloadUrl) ? <a href={safeExternalUrl(tool.downloadUrl)} target="_blank" rel="noopener noreferrer" className="tool-link">OPEN REPOSITORY <ArrowUpRight size={13} /></a> : <button type="button" className="tool-link" onClick={() => setComingOpen(true)}>OPEN REPOSITORY <ArrowUpRight size={13} /></button>}</article>)}</div><ComingSoonModal open={comingOpen} onClose={() => setComingOpen(false)} /></section>;
}

function CommunityView({ posts, requests, loading, error, postText, setPostText, onPost, onLike, onFollow, onFriend, onRespond }: { posts: any[]; requests: any[]; loading: boolean; error?: unknown; postText: string; setPostText: (value: string) => void; onPost: () => void; onLike: (id: number) => void; onFollow: (id: number) => void; onFriend: (id: number) => void; onRespond: (id: number, accept: boolean) => void }) {
  const [comingOpen, setComingOpen] = useState(false);
  if (loading) return <ModuleState title="جارٍ مزامنة إشارات المجتمع..." />;
  if (error) return <ModuleState title="تعذر تحميل المجتمع." error={error} />;
  return <><section className="community-layout"><div className="community-main"><div className="compose-card panel-card"><div className="compose-avatar">◩</div><div className="compose-input"><textarea value={postText} onChange={event => setPostText(event.target.value)} placeholder="اكتب سؤالًا أو إنجازًا أو ملاحظة مفيدة للمجتمع..." /><div className="compose-foot"><span><Sparkles size={14} /> راجع المحتوى قبل النشر</span><button className="primary-button compact" disabled={!postText.trim()} onClick={onPost}>نشر <Send size={14} /></button></div></div></div>{posts.length ? posts.map((post: any) => <article className="post-card panel-card" key={post.id}><div className="post-head"><div className="post-avatar">{post.author?.[0] ?? "A"}</div><div><strong>{post.author ?? "عضو CyberJocx"}</strong><span>{new Date(post.createdAt).toLocaleDateString("ar-EG")}</span></div><button className="ghost-icon" onClick={() => post.userId && onFollow(post.userId)} title="متابعة المستخدم"><UserPlus size={15} /></button><button className="ghost-icon" onClick={() => post.userId && onFriend(post.userId)} title="إرسال طلب صداقة"><Users size={15} /></button></div><p className="post-content">{post.content}</p><div className="post-actions"><button onClick={() => onLike(post.id)}><Heart size={15} /> {post.likesCount ?? 0}</button><button type="button" onClick={() => setComingOpen(true)}><MessageSquare size={15} /> نقاش</button><button type="button" onClick={() => setComingOpen(true)}><ArrowUpRight size={15} /> مشاركة</button></div></article>) : <div className="empty-state panel-card"><MessageSquare size={27} /><h3>لا توجد منشورات بعد.</h3><p>كن أول من ينشر معلومة أو سؤالًا مفيدًا.</p></div>}</div><aside className="community-aside">{requests.length > 0 && <div className="topic-card panel-card"><div className="section-tag">// FRIEND REQUESTS</div>{requests.map(request => <div className="friend-request" key={request.id}><span>طلب من مستخدم #{request.senderId}</span><div><button className="small-button" onClick={() => onRespond(request.id, true)}>قبول</button><button className="ghost-icon" onClick={() => onRespond(request.id, false)}><X size={14} /></button></div></div>)}</div>}<div className="network-card panel-card"><div className="section-tag">// COMMUNITY PULSE</div><div className="empty-state"><Sparkles size={21} /><p>Coming Soon</p></div></div><div className="topic-card panel-card"><div className="section-tag">// TOPICS</div>{["#threathunting", "#websecurity", "#blueteam", "#cve-watch"].map((topic, index) => <div className="topic-row" key={topic}><span>0{index + 1}</span><strong>{topic}</strong><em>TOPIC</em></div>)}</div></aside></section><ComingSoonModal open={comingOpen} onClose={() => setComingOpen(false)} /></>;
}

function MarketView({ books, loading, error, cartItems, cartCount, onAdd, onRemove, search, setSearch, category, setCategory, maxPoints, setMaxPoints, sort, setSort }: { books: any[]; loading: boolean; error?: unknown; cartItems: any[]; cartCount: number; onAdd: (id: number) => void; onRemove: (id: number) => void; search: string; setSearch: (value: string) => void; category: string; setCategory: (value: string) => void; maxPoints: string; setMaxPoints: (value: string) => void; sort: "title" | "price" | "recent"; setSort: (value: "title" | "price" | "recent") => void }) {
  const [cartOpen, setCartOpen] = useState(false);
  if (loading) return <ModuleState title="جارٍ مزامنة الأرشيف..." />;
  if (error) return <ModuleState title="تعذر تحميل السوق." error={error} />;
  if (!books.length) return <ModuleState title="لم تتم إضافة أي منتج إلى السوق بعد." empty />;
  const items = books;
  const categories = ["all", ...Array.from(new Set(books.map(book => book.category)))];
  return <section className="module-stack"><div className="market-banner panel-card"><div><div className="section-tag">// CYBERJOCX ARCHIVE</div><h2>Knowledge is the ultimate exploit.</h2><p>اشترِ بالـ XP، اجمع مراجعك، وابنِ مكتبة لا تنام.</p></div><button className="cart-button" onClick={() => setCartOpen(true)}><ShoppingCart size={17} /> CART <b>{cartCount}</b></button></div><div className="module-toolbar"><div className="search-box wide"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث بالعنوان أو المؤلف أو الوصف..." /></div><div className="filter-tabs"><Filter size={15} />{categories.slice(0, 6).map(value => <button key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)}>{value.toUpperCase()}</button>)}</div><input className="points-filter" value={maxPoints} onChange={event => setMaxPoints(event.target.value.replace(/[^0-9]/g, ""))} placeholder="MAX XP" /><select className="sort-select" value={sort} onChange={event => setSort(event.target.value as "title" | "price" | "recent")}><option value="recent">SORT: RECENT</option><option value="title">SORT: TITLE</option><option value="price">SORT: XP</option></select></div><div className="book-grid">{items.map((book, index) => <article className="book-card panel-card" key={book.id}><div className={`book-cover book-${index % 3}`}><BookOpen size={32} /><span>ARCHIVE<br />VOL. 0{index + 1}</span></div><div className="book-content"><div className="course-row-meta">{book.category} ARCHIVE</div><h3>{book.title}</h3><p>{book.author}</p><div className="book-foot"><strong><Zap size={14} /> {book.pricePoints} XP</strong><button className="small-button" onClick={() => onAdd(book.id)}>ADD <Plus size={14} /></button></div></div></article>)}</div>{cartOpen && <div className="modal-backdrop" onClick={() => setCartOpen(false)}><div className="cart-modal panel-card" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setCartOpen(false)}><X size={16} /></button><div className="section-tag">// SHOPPING CART MATRIX</div><h2>Your archive queue.</h2>{cartItems.length ? <div className="cart-items">{cartItems.map(item => <div className="cart-item" key={item.id}><div><strong>{item.book?.title ?? `BOOK NODE ${item.bookId}`}</strong><span>{item.quantity} × {item.book?.pricePoints ?? 0} XP</span></div><button className="ghost-icon" onClick={() => onRemove(item.id)}><X size={15} /></button></div>)}</div> : <div className="cart-empty"><ShoppingCart size={22} /><p>السلة فارغة. أضف مرجعًا إلى قائمة الأرشيف.</p></div>}<div className="cart-total"><span>TOTAL NODES</span><strong>{cartCount}</strong></div></div></div>}</section>;
}

function MalwareView({ items, loading, error, search, setSearch, category, setCategory }: { items: any[]; loading: boolean; error?: unknown; search: string; setSearch: (value: string) => void; category: string; setCategory: (value: string) => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const detail = trpc.malware.byId.useQuery({ id: selectedId ?? 0 }, { enabled: selectedId !== null });
  const categories = ["all", "Ransomware", "Loader / Banking Trojan", "Information Stealer", "Wiper"];
  if (loading) return <ModuleState title="جارٍ تحميل مركز Malware..." />;
  if (error) return <ModuleState title="تعذر تحميل بيانات Malware." error={error} />;
  return <section className="module-stack"><div className="module-toolbar"><div className="search-box wide"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث باسم العائلة أو التقنية أو الوصف..." /></div><div className="filter-tabs"><Filter size={15} />{categories.map(value => <button key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)}>{value === "all" ? "الكل" : value}</button>)}</div><span className="result-count">{items.length} FAMILIES</span></div><div className="intel-banner panel-card"><div className="intel-glyph"><Bug size={28} /></div><div><div className="section-tag">// MALWARE INTELLIGENCE</div><h2>افهم السلوك قبل بناء الدفاع.</h2><p>مركز داخلي للعائلات الخبيثة والتقنيات المرتبطة بها، مخصص للبحث والتحليل والدفاع القانوني.</p></div></div>{items.length ? <div className="tools-grid">{items.map(item => <article className="tool-card panel-card" key={item.id} onClick={() => setSelectedId(item.id)} role="button" tabIndex={0} onKeyDown={event => event.key === "Enter" && setSelectedId(item.id)}><div className="tool-card-top"><div className="tool-icon tool-1"><Bug size={20} /></div><span className={`severity-pill ${item.severity}`}>{item.severity}</span></div><h3>{item.name}</h3><p>{item.description}</p><div className="command-line"><span>MITRE</span>{item.mitreTechniques}</div><div className="detail-meta"><span>TARGETS: {item.targets}</span></div><button className="tool-link" onClick={event => { event.stopPropagation(); setSelectedId(item.id); }}>عرض التفاصيل <ArrowUpRight size={13} /></button></article>)}</div> : <ModuleState title="لم تُفهرس عائلات Malware بهذه الفلاتر بعد." empty />}{selectedId !== null && <div className="modal-backdrop" onClick={() => setSelectedId(null)}><div className="detail-modal panel-card" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedId(null)}><X size={16} /></button><div className="section-tag">// MALWARE PROFILE</div><h2>{detail.data?.name ?? "جارٍ التحميل"}</h2><p>{detail.data?.description}</p><div className="detail-meta"><span>{detail.data?.category}</span><span>{detail.data?.severity}</span><span>{detail.data?.targets}</span></div><div className="command-line"><span>MITRE TECHNIQUES</span>{detail.data?.mitreTechniques}</div>{safeExternalUrl(detail.data?.sourceUrl) && <a href={safeExternalUrl(detail.data?.sourceUrl)} target="_blank" rel="noopener noreferrer" className="primary-button">فتح المرجع <ArrowUpRight size={14} /></a>}</div></div>}</section>;
}

function CtfView({ isAuthenticated, onSignIn }: { isAuthenticated: boolean; onSignIn: () => void }) {
  const events = trpc.ctf.events.useQuery();
  const [eventId, setEventId] = useState<number | null>(null);
  const [challengeId, setChallengeId] = useState<number | null>(null);
  const [flag, setFlag] = useState("");
  const event = trpc.ctf.event.useQuery({ eventId: eventId ?? 0 }, { enabled: eventId !== null });
  const submit = trpc.ctf.submit.useMutation({
    onSuccess: result => {
      setFlag("");
      toast[result.correct ? "success" : "error"](result.correct ? `Correct flag · +${result.awardedXp} XP` : "Flag not accepted. Check the challenge and try again.");
      void event.refetch();
    },
    onError: error => toast.error(error.message || "Unable to submit this flag."),
  });

  useEffect(() => {
    if (eventId === null && events.data?.length) setEventId(events.data[0].id);
  }, [eventId, events.data]);

  const challenges = event.data?.challenges ?? [];
  const activeChallenge = challenges.find(item => item.challenge.id === challengeId) ?? challenges[0] ?? null;
  useEffect(() => {
    if (activeChallenge && challengeId !== activeChallenge.challenge.id) setChallengeId(activeChallenge.challenge.id);
  }, [activeChallenge, challengeId]);

  if (events.isLoading) return <ModuleState title="جارٍ تحميل فعاليات CTF..." />;
  if (events.error) return <ModuleState title="تعذر تحميل فعاليات CTF." error={events.error} />;
  if (!events.data?.length) return <section className="cj-ctf-page module-stack"><div className="learning-banner panel-card"><div><div className="section-tag">// CYBERJOCX CTF ARENA</div><h2>ميدان التحديات</h2><p>لا توجد فعالية CTF نشطة حاليًا. ستظهر التحديات هنا عند تفعيل فعالية من الإدارة.</p></div></div><ModuleState title="لا توجد فعاليات نشطة حاليًا." empty /></section>;

  return (
    <section className="cj-ctf-page module-stack">
      <header className="cj-ctf-hero panel-card">
        <div><div className="section-tag">// THINK · EXPLOIT · GET FLAGS</div><h2>{event.data?.event.title ?? events.data.find(item => item.id === eventId)?.title ?? "CTF Arena"}</h2><p>{event.data?.event.description ?? "اختر فعالية ثم نفّذ التحديات وسجّل الأعلام الصحيحة لجمع النقاط."}</p></div>
        <div className="cj-ctf-event-select"><label>ACTIVE EVENT</label><select value={eventId ?? ""} onChange={value => { setEventId(Number(value)); setChallengeId(null); }}><option value="" disabled>Choose event</option>{events.data.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
      </header>

      <div className="cj-ctf-layout">
        <aside className="cj-ctf-challenge-list panel-card">
          <div className="cj-ctf-card-heading"><Terminal size={18} /><strong>Challenge sequence</strong><span>{challenges.length} tasks</span></div>
          {challenges.map((item,index) => (
            <button type="button" key={item.challenge.id} className={activeChallenge?.challenge.id===item.challenge.id?"is-active":""} onClick={() => {setChallengeId(item.challenge.id);setFlag("");}}>
              <b>{String(index+1).padStart(2,"0")}</b><span><strong>{item.challenge.title}</strong><small>{item.category} · {item.challenge.difficulty}</small></span><em>{item.challenge.points} XP</em>
            </button>
          ))}
        </aside>

        <div className="cj-ctf-task panel-card">
          {event.isLoading ? <ModuleState title="جارٍ تحميل تفاصيل الفعالية..." /> : event.error ? <ModuleState title="تعذر تحميل التحديات." error={event.error} /> : activeChallenge ? (
            <>
              <div className="cj-ctf-task-head"><div><span>CHALLENGE {String(challenges.findIndex(item=>item.challenge.id===activeChallenge.challenge.id)+1).padStart(2,"0")}</span><h3>{activeChallenge.challenge.title}</h3></div><span className={`cj-ctf-difficulty ${activeChallenge.challenge.difficulty}`}>{activeChallenge.challenge.difficulty}</span></div>
              <div className="cj-ctf-objective"><strong><Target size={16}/> Objective</strong><p>{activeChallenge.challenge.description}</p></div>
              <div className="cj-ctf-meta"><span>{activeChallenge.category}</span><span>{activeChallenge.challenge.points.toLocaleString()} XP</span><span>{challenges.length} challenges in event</span></div>
              <form className="cj-ctf-submit" onSubmit={event => {event.preventDefault();if(!isAuthenticated){onSignIn();return;}if(flag.trim())submit.mutate({eventId:eventId!,challengeId:activeChallenge.challenge.id,flag:flag.trim()});}}>
                <label htmlFor="ctf-flag-input">Submit Flag</label>
                <div><input id="ctf-flag-input" value={flag} onChange={event=>setFlag(event.target.value)} placeholder="HTB{...}" autoComplete="off" spellCheck={false}/><button type="submit" disabled={!flag.trim()||submit.isPending}>{!isAuthenticated?"Sign in":"Submit"} <Send size={14}/></button></div>
                <small>يتم التحقق من العلم على الخادم. لا تعرض الواجهة الإجابة الصحيحة أو hash التخزين.</small>
              </form>
            </>
          ) : <ModuleState title="لا توجد تحديات مرتبطة بهذه الفعالية." empty />}
        </div>

        <aside className="cj-ctf-side">
          <section className="panel-card cj-ctf-info"><div className="cj-ctf-card-heading"><ShieldCheck size={18}/><strong>Environment info</strong></div><p>لا يتم عرض عنوان IP أو تفاصيل جهاز افتراضي إلا بعد توفير بيئة فعلية مرتبطة بالتحدي.</p><div><span>Event</span><b>{event.data?.event.title ?? "Loading..."}</b></div><div><span>Challenge</span><b>{activeChallenge?.challenge.difficulty ?? "—"}</b></div></section>
          <section className="panel-card cj-ctf-terminal"><div className="cj-ctf-card-heading"><Terminal size={18}/><strong>Practice terminal</strong></div><div className="cj-ctf-terminal-body"><span>cyberjocx@operator:~$</span><p>Terminal access becomes available when a provisioned lab is linked to this challenge.</p><i>Environment not attached</i></div></section>
        </aside>
      </div>
    </section>
  );
}

function LabsView({ isAuthenticated, onSignIn }: { isAuthenticated: boolean; onSignIn: () => void }) {
  const templates = trpc.labs.templates.useQuery();
  const instances = trpc.labs.myInstances.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: isAuthenticated ? 15_000 : false });
  const [startingTemplate, setStartingTemplate] = useState<number | null>(null);
  const start = trpc.labs.start.useMutation({
    onSuccess: () => { setStartingTemplate(null); void instances.refetch(); toast.success("تم إنشاء طلب البيئة. ستظهر حالتها هنا عند جاهزيتها."); },
    onError: error => { setStartingTemplate(null); toast.error(error.message || "تعذر بدء البيئة."); },
  });
  const submitFlag = trpc.labs.submitFlag.useMutation({
    onSuccess: result => { toast[result.correct ? "success" : "error"](result.correct ? "تم تأكيد العلم." : "العلم غير صحيح."); void instances.refetch(); },
    onError: error => toast.error(error.message || "تعذر التحقق من العلم."),
  });
  const [flags,setFlags]=useState<Record<number,string>>({});
  const safeStatus=(status:string)=>status.toLowerCase().replaceAll("_"," ");

  return (
    <section className="cj-labs-page module-stack">
      <header className="learning-banner panel-card"><div><div className="section-tag">// SAFE VIRTUAL PRACTICE ENVIRONMENTS</div><h2>Practice Labs</h2><p>ابدأ بيئة تدريب فعلية، تابع حالة التشغيل، وأرسل العلم عند تجهيز المختبر. لا نعرض عنوان اتصال تجريبي أو غير مرتبط ببيئتك.</p></div><div className="roadmap-steps"><span className="active">01 / REQUEST</span><span>02 / PROVISION</span><span>03 / PRACTICE</span></div></header>
      {!isAuthenticated && <div className="system-alert"><LockKeyhole size={15}/><span>سجّل الدخول لبدء بيئة تدريب وتتبع جلساتك.</span><button className="small-button" onClick={onSignIn}>Sign in</button></div>}
      {templates.isLoading ? <ModuleState title="جارٍ تحميل قوالب المختبرات..." /> : templates.error ? <ModuleState title="تعذر تحميل قوالب المختبرات." error={templates.error}/> : !templates.data?.length ? <ModuleState title="لم يتم تفعيل أي قالب مختبر حتى الآن." empty/> : (
        <div className="cj-labs-grid">{templates.data.map(template=>(
          <article className="cj-lab-template panel-card" key={template.id}>
            <div className="cj-lab-template-top"><span><Boxes size={23}/></span><em>{template.cpuLimit} vCPU</em></div>
            <div className="section-tag">// {template.slug}</div><h3>{template.name}</h3><p>{template.description}</p>
            <div className="cj-lab-specs"><span>{template.memoryMb} MB RAM</span><span>{template.diskMb} MB Disk</span><span>{Math.round(template.ttlSeconds/60)} min TTL</span></div>
            <button className="primary-button compact" type="button" disabled={!isAuthenticated||start.isPending} onClick={()=>{if(!isAuthenticated){onSignIn();return;}setStartingTemplate(template.id);start.mutate({templateId:template.id});}}>{startingTemplate===template.id&&start.isPending?"Requesting...":"Launch environment"} <ArrowUpRight size={14}/></button>
          </article>
        ))}</div>
      )}
      <section className="cj-lab-sessions panel-card">
        <div className="card-head"><div><div className="section-tag">// YOUR ACTIVE SESSIONS</div><h3>My lab instances</h3></div><span>{instances.data?.length??0} sessions</span></div>
        {!isAuthenticated ? <p className="empty-state">سجّل الدخول لعرض جلساتك.</p> : instances.isLoading ? <ModuleState title="جارٍ تحميل جلسات المختبر..." /> : !instances.data?.length ? <ModuleState title="لا توجد جلسات مختبر بعد." empty/> : instances.data.map(instance=>(
          <div className="cj-lab-session" key={instance.id}>
            <div><strong>{instance.templateName}</strong><small>{instance.instanceId.slice(0,12)} · expires {new Date(instance.expiresAt).toLocaleString()}</small></div>
            <span className={`cj-lab-status status-${instance.status.toLowerCase()}`}>{safeStatus(instance.status)}</span>
            {safeExternalUrl(instance.targetUrl) ? <a className="small-button" href={safeExternalUrl(instance.targetUrl)} target="_blank" rel="noreferrer">Open environment <ArrowUpRight size={13}/></a> : <span className="cj-lab-pending">Environment endpoint pending</span>}
            {instance.status==="READY"&&<form className="cj-lab-flag" onSubmit={event=>{event.preventDefault();const value=flags[instance.id]?.trim();if(value)submitFlag.mutate({instanceId:instance.id,flag:value});}}><input value={flags[instance.id]??""} onChange={event=>setFlags(old=>({...old,[instance.id]:event.target.value}))} placeholder="HTB{...}" autoComplete="off"/><button type="submit" disabled={!flags[instance.id]?.trim()||submitFlag.isPending}>Verify flag</button></form>}
          </div>
        ))}
      </section>
    </section>
  );
}

function InstructorView() {
  const dashboard = trpc.instructor.dashboard.useQuery(undefined, { refetchInterval: 30_000 });
  const [course, setCourse] = useState({ title: "", slug: "", description: "", category: "Cybersecurity", level: "beginner" as "beginner"|"intermediate"|"advanced", lessons: "8", durationMinutes: "240" });
  const [requestingCourseId, setRequestingCourseId] = useState<number | null>(null);
  const [changeDescription, setChangeDescription] = useState("");
  const submitCourse = trpc.instructor.submitCourse.useMutation({
    onSuccess: () => { setCourse({ title:"",slug:"",description:"",category:"Cybersecurity",level:"beginner",lessons:"8",durationMinutes:"240" }); void dashboard.refetch(); toast.success("تم إرسال الدورة كمسودة لمراجعة المالك قبل النشر."); },
    onError: error => toast.error(error.message || "تعذر إرسال الدورة."),
  });
  const requestUpdate = trpc.instructor.requestCourseUpdate.useMutation({
    onSuccess: () => { setRequestingCourseId(null); setChangeDescription(""); void dashboard.refetch(); toast.success("تم إرسال طلب التعديل للموافقة."); },
    onError: error => toast.error(error.message || "تعذر إرسال طلب التعديل."),
  });
  const data = dashboard.data;
  const totals = data?.totals ?? { courses:0,published:0,students:0,averageProgress:0 };

  return (
    <section className="cj-instructor-page module-stack">
      <header className="admin-hero panel-card"><div className="section-tag">// INSTRUCTOR WORKSPACE</div><h2>Teach. Track. Improve.</h2><p>تابع طلابك ودوراتك، وقدّم المحتوى للمراجعة. نشر الدورة وتعديل المحتوى المنشور يظلان تحت موافقة مالك المنصة.</p></header>
      {dashboard.error && <ModuleState title="تعذر تحميل مساحة المدرّس." error={dashboard.error}/>}
      <div className="admin-metrics">
        <div className="admin-metric panel-card"><BookOpen size={18}/><strong>{totals.courses}</strong><span>MY COURSES</span></div>
        <div className="admin-metric panel-card"><Check size={18}/><strong>{totals.published}</strong><span>PUBLISHED</span></div>
        <div className="admin-metric panel-card"><Users size={18}/><strong>{totals.students}</strong><span>UNIQUE STUDENTS</span></div>
        <div className="admin-metric panel-card"><Activity size={18}/><strong>{totals.averageProgress}%</strong><span>AVERAGE PROGRESS</span></div>
      </div>

      <section className="admin-editor panel-card">
        <div className="card-head"><div><div className="section-tag">// SUBMIT NEW COURSE</div><h3>Create a draft for owner review</h3></div><span className="status-chip">NOT PUBLISHED</span></div>
        <div className="admin-form-grid">
          <label className="admin-field"><span>COURSE TITLE</span><input value={course.title} onChange={event=>setCourse(old=>({...old,title:event.target.value}))} placeholder="Web Application Security"/></label>
          <label className="admin-field"><span>SLUG</span><input value={course.slug} onChange={event=>setCourse(old=>({...old,slug:event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g,"-")}))} placeholder="web-application-security"/></label>
          <label className="admin-field"><span>CATEGORY</span><input value={course.category} onChange={event=>setCourse(old=>({...old,category:event.target.value}))} placeholder="Cybersecurity"/></label>
          <label className="admin-field"><span>LEVEL</span><select value={course.level} onChange={event=>setCourse(old=>({...old,level:event.target.value as typeof old.level}))}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
          <label className="admin-field"><span>LESSONS</span><input type="number" min="1" max="500" value={course.lessons} onChange={event=>setCourse(old=>({...old,lessons:event.target.value}))}/></label>
          <label className="admin-field"><span>DURATION (MINUTES)</span><input type="number" min="1" value={course.durationMinutes} onChange={event=>setCourse(old=>({...old,durationMinutes:event.target.value}))}/></label>
          <label className="admin-field full"><span>DESCRIPTION (AT LEAST 20 CHARACTERS)</span><textarea value={course.description} onChange={event=>setCourse(old=>({...old,description:event.target.value}))} placeholder="Describe the learning outcomes, scope, and practical work."/></label>
        </div>
        <button className="primary-button" type="button" disabled={submitCourse.isPending||!course.title.trim()||!course.slug.trim()||course.description.trim().length<20} onClick={()=>submitCourse.mutate({...course,lessons:Number(course.lessons),durationMinutes:Number(course.durationMinutes)})}><Send size={15}/> Submit for approval</button>
      </section>

      <section className="admin-table panel-card">
        <div className="card-head"><div><div className="section-tag">// YOUR COURSES</div><h3>Course performance</h3></div><span>{totals.courses} courses</span></div>
        {dashboard.isLoading ? <ModuleState title="جارٍ تحميل دوراتك..." /> : !data?.courses.length ? <ModuleState title="لم ترسل أي دورة بعد." empty/> : data.courses.map(item=>(
          <article className="cj-instructor-course-row" key={item.id}>
            <div><strong>{item.title}</strong><small>{item.category} · {item.level} · {item.lessons} lessons</small></div>
            <span className={item.isPublished?"status-published":"status-draft"}>{item.isPublished?"Published":"Draft / Pending"}</span>
            {item.isPublished&&<button className="small-button" type="button" onClick={()=>{setRequestingCourseId(item.id);setChangeDescription("");}}>Request update</button>}
          </article>
        ))}
      </section>

      {requestingCourseId!==null&&<section className="admin-editor panel-card">
        <div className="card-head"><div><div className="section-tag">// OWNER APPROVAL REQUIRED</div><h3>Request course changes</h3></div><button className="small-button" type="button" onClick={()=>setRequestingCourseId(null)}>Cancel</button></div>
        <label className="admin-field full"><span>PROPOSED DESCRIPTION</span><textarea value={changeDescription} onChange={event=>setChangeDescription(event.target.value)} placeholder="اكتب الوصف الجديد للدورة أو التغييرات المطلوبة..."/></label>
        <button className="primary-button" disabled={requestUpdate.isPending||changeDescription.trim().length<20} onClick={()=>requestUpdate.mutate({courseId:requestingCourseId,changes:{description:changeDescription.trim()}})}><Send size={15}/> Send update request</button>
      </section>}

      <section className="admin-table panel-card">
        <div className="card-head"><div><div className="section-tag">// STUDENT PERFORMANCE</div><h3>Progress and activity</h3></div><span>{data?.students.length??0} progress records</span></div>
        {!data?.students.length ? <ModuleState title="لا توجد سجلات تقدم للطلاب في دوراتك حتى الآن." empty/> : data.students.map((student,index)=>(
          <div className="cj-instructor-student-row" key={`${student.courseId}-${student.userId}-${index}`}>
            <div><strong>{student.studentName||"CyberJocx learner"}</strong><small>{student.studentEmail||"Email unavailable"} · {data.courses.find(course=>course.id===student.courseId)?.title??"Course"}</small></div>
            <span>{student.progress}%</span><b>{student.completed?"Completed":"In progress"}</b>
          </div>
        ))}
      </section>

      <section className="cj-instructor-bottom-grid">
        <div className="panel-card instructor-info-card"><div className="section-tag">// COURSE CHANGE REQUESTS</div><h3>Review status</h3>{data?.requests.length?data.requests.map(request=><div className="cj-instructor-request" key={request.id}><strong>{request.courseTitle}</strong><span>{request.status}</span><small>{new Date(request.requestedAt).toLocaleString()}</small>{request.reviewNote&&<p>{request.reviewNote}</p>}</div>):<p>No update requests yet.</p>}</div>
        <div className="panel-card instructor-info-card"><div className="section-tag">// EARNINGS & GROWTH</div><h3>Financial reporting</h3><p>عدد الطلاب ومتوسط التقدم محسوبان من سجلات المنصة الحالية. الأرباح والمدفوعات غير متاحة بعد لأن بوابة الدفع وجدول المعاملات غير مربوطين.</p><span className="instructor-unavailable">Earnings not connected</span></div>
      </section>
    </section>
  );
}

function AdminWorkflowPanel() {
  const queue = trpc.admin.courseReviewQueue.useQuery(undefined,{refetchInterval:30_000});
  const accounts = trpc.admin.users.useQuery(undefined,{refetchInterval:60_000});
  const audit = trpc.admin.audit.useQuery(undefined,{refetchInterval:60_000});
  const publish = trpc.admin.publishCourse.useMutation({onSuccess:()=>{void queue.refetch();toast.success("تم نشر الدورة وإرسال إشعار لكل المستخدمين.");},onError:error=>toast.error(error.message)});
  const review = trpc.admin.reviewCourseChange.useMutation({onSuccess:()=>{void queue.refetch();void audit.refetch();toast.success("تم تسجيل قرار المراجعة.");},onError:error=>toast.error(error.message)});
  const setRole = trpc.admin.setUserRole.useMutation({onSuccess:()=>{void accounts.refetch();void audit.refetch();toast.success("تم تحديث صلاحية الحساب.");},onError:error=>toast.error(error.message)});

  return (
    <section className="cj-admin-workflow module-stack">
      <section className="admin-table panel-card">
        <div className="card-head"><div><div className="section-tag">// OWNER APPROVAL QUEUE</div><h3>Course publication and change requests</h3></div><span>{(queue.data?.drafts.length??0)+(queue.data?.changes.length??0)} pending</span></div>
        {queue.error ? <ModuleState title="قائمة الموافقات متاحة لحساب مالك المنصة فقط." error={queue.error}/> : queue.isLoading ? <ModuleState title="جارٍ تحميل قائمة الموافقات..."/> : (
          <>
            <div className="cj-admin-queue-group"><h4>Draft courses awaiting publication</h4>{queue.data?.drafts.length?queue.data.drafts.map(item=><div className="cj-admin-review-row" key={item.id}><div><strong>{item.title}</strong><small>{item.category} · {item.level} · {item.instructor}</small></div><button className="primary-button compact" disabled={publish.isPending} onClick={()=>publish.mutate({id:item.id})}>Approve & publish</button></div>):<p>No draft courses waiting.</p>}</div>
            <div className="cj-admin-queue-group"><h4>Instructor update requests</h4>{queue.data?.changes.length?queue.data.changes.map(item=><div className="cj-admin-review-row is-change" key={item.id}><div><strong>{item.courseTitle}</strong><small>{item.instructorName||item.instructorEmail||"Instructor"} · {new Date(item.requestedAt).toLocaleString()}</small><pre>{item.changesJson}</pre></div><div className="cj-admin-review-actions"><button className="primary-button compact" disabled={review.isPending} onClick={()=>review.mutate({requestId:item.id,decision:"approve"})}>Approve</button><button className="small-button" disabled={review.isPending} onClick={()=>review.mutate({requestId:item.id,decision:"reject",note:"Please revise the requested change and resubmit."})}>Reject</button></div></div>):<p>No pending update requests.</p>}</div>
          </>
        )}
      </section>

      <section className="admin-table panel-card">
        <div className="card-head"><div><div className="section-tag">// ACCESS MANAGEMENT</div><h3>Instructor accounts</h3></div><span>Owner only</span></div>
        {accounts.error ? <ModuleState title="إدارة الأدوار متاحة لحساب المالك فقط." error={accounts.error}/> : accounts.data?.map(account=><div className="cj-admin-review-row" key={account.id}><div><strong>{account.name||"Unnamed account"}</strong><small>{account.email||`User #${account.id}`} · {account.role}</small></div>{account.role==="admin"?<span className="status-published">Platform admin</span>:<button className="small-button" disabled={setRole.isPending} onClick={()=>setRole.mutate({userId:account.id,role:account.role==="instructor"?"user":"instructor"})}>{account.role==="instructor"?"Remove instructor":"Grant instructor"}</button>}</div>)}
      </section>

      <section className="admin-table panel-card">
        <div className="card-head"><div><div className="section-tag">// AUDIT LOG</div><h3>Recorded owner actions</h3></div><span>{audit.data?.length??0} entries</span></div>
        {audit.error ? <p>Audit log is available to the configured owner account only.</p> : audit.data?.length ? audit.data.map(item=><div className="audit-row" key={item.id}><span>#{item.id}</span><strong>{item.action} · {item.resourceType} #{item.resourceId??"—"}</strong><em>{new Date(item.createdAt).toLocaleString()}</em><Check size={15}/></div>) : <p>No owner actions have been recorded yet.</p>}
      </section>
    </section>
  );
}

function AdminView() {
  const [mode, setMode] = useState<"course" | "tool" | "cve">("course");
  const [form, setForm] = useState<Record<string, string>>({});
  const adminStats = trpc.admin.stats.useQuery();
  const adminContent = trpc.admin.content.useQuery();
  const createCourse = trpc.admin.createCourse.useMutation({ onSuccess: () => { setForm({}); adminStats.refetch(); adminContent.refetch(); toast.success("تم نشر عقدة الدورة وإرسال إشعار للمستخدمين"); }, onError: error => toast.error(error.message) });
  const createTool = trpc.admin.createTool.useMutation({ onSuccess: () => { setForm({}); adminStats.refetch(); adminContent.refetch(); toast.success("تمت إضافة الأداة إلى الدليل"); }, onError: error => toast.error(error.message) });
  const createCve = trpc.admin.createCve.useMutation({ onSuccess: () => { setForm({}); adminStats.refetch(); adminContent.refetch(); toast.success("تمت فهرسة CVE وإرسال تنبيه الخطورة"); }, onError: error => toast.error(error.message) });
  const deleteCourse = trpc.admin.deleteCourse.useMutation({ onSuccess: () => { adminContent.refetch(); adminStats.refetch(); toast.success("تم حذف عقدة الدورة"); } });
  const deleteTool = trpc.admin.deleteTool.useMutation({ onSuccess: () => { adminContent.refetch(); adminStats.refetch(); toast.success("تم حذف الأداة"); } });
  const deleteCve = trpc.admin.deleteCve.useMutation({ onSuccess: () => { adminContent.refetch(); adminStats.refetch(); toast.success("تم حذف إشارة CVE"); } });
  const update = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = () => {
    if (mode === "course") createCourse.mutate({ title: form.title ?? "", slug: form.slug ?? (form.title ?? "").toLowerCase().replaceAll(" ", "-"), description: form.description ?? "", category: form.category ?? "WEB SECURITY", level: (form.level as "beginner" | "intermediate" | "advanced") ?? "beginner", instructor: form.instructor ?? "CYBERJOCX LAB", lessons: Number(form.lessons ?? 8), durationMinutes: Number(form.durationMinutes ?? 240) });
    if (mode === "tool") createTool.mutate({ name: form.name ?? "", category: form.category ?? "RECON", description: form.description ?? "", commands: form.commands, downloadUrl: form.downloadUrl });
    if (mode === "cve") createCve.mutate({ cveNumber: form.cveNumber ?? "", title: form.title ?? "", description: form.description ?? "", severity: (form.severity as "critical" | "high" | "medium" | "low") ?? "high", cvss: form.cvss ?? "7.5", publishedDate: form.publishedDate ?? new Date().toISOString().slice(0, 10), affected: form.affected ?? "Unknown", sourceUrl: form.sourceUrl });
  };
  const field = (key: string, label: string, placeholder: string) => <label className="admin-field"><span>{label}</span><input value={form[key] ?? ""} onChange={event => update(key, event.target.value)} placeholder={placeholder} /></label>;
  const stats = adminStats.data ?? { users: 0, courses: 0, cves: 0, tools: 0, posts: 0 };
  return <section className="admin-layout"><div className="admin-hero panel-card"><div className="section-tag">// ROOT ACCESS GRANTED</div><h2>Control the knowledge layer.</h2><p>إدارة المحتوى ومراجعة نبض المنصة من نقطة تحكم واحدة.</p><div className="admin-actions"><button className={`primary-button ${mode === "course" ? "" : "secondary-button"}`} onClick={() => setMode("course")}><BookOpen size={16} /> COURSE NODE</button><button className={`primary-button ${mode === "tool" ? "" : "secondary-button"}`} onClick={() => setMode("tool")}><Wrench size={16} /> TOOL NODE</button><button className={`primary-button ${mode === "cve" ? "" : "secondary-button"}`} onClick={() => setMode("cve")}><Bug size={16} /> CVE SIGNAL</button></div></div><div className="admin-metrics"><div className="admin-metric panel-card"><Users size={18} /><strong>{stats.users.toLocaleString()}</strong><span>REGISTERED OPERATORS</span></div><div className="admin-metric panel-card"><BookOpen size={18} /><strong>{stats.courses}</strong><span>COURSE NODES</span></div><div className="admin-metric panel-card"><Bug size={18} /><strong>{stats.cves.toLocaleString()}</strong><span>CVE SIGNALS</span></div><div className="admin-metric panel-card"><Wrench size={18} /><strong>{stats.tools}</strong><span>TOOL REPOSITORY</span></div></div><div className="admin-editor panel-card"><div className="card-head"><div><div className="section-tag">// WRITE TO KNOWLEDGE LAYER</div><h3>Publish {mode === "course" ? "course" : mode === "tool" ? "tool" : "CVE"} node</h3></div><span className="status-chip"><span className="pulse-dot" /> VALIDATED</span></div><div className="admin-form-grid">{mode === "course" && <>{field("title", "TITLE", "Threat Hunting Protocol")} {field("slug", "SLUG", "threat-hunting-protocol")} {field("category", "CATEGORY", "THREAT INTEL")} {field("instructor", "INSTRUCTOR", "NEXUS LAB")} {field("lessons", "LESSONS", "12")} {field("durationMinutes", "DURATION MINUTES", "360")}</>}{mode === "tool" && <>{field("name", "NAME", "Nmap")} {field("category", "CATEGORY", "RECON")} {field("commands", "COMMANDS", "nmap -sV --script safe target")} {field("downloadUrl", "REPOSITORY URL", "https://...")}</>}{mode === "cve" && <>{field("cveNumber", "CVE NUMBER", "CVE-2026-0000")} {field("title", "TITLE", "Critical signal title")} {field("severity", "SEVERITY", "critical")} {field("cvss", "CVSS", "9.8")} {field("affected", "AFFECTED PRODUCT", "Product / version")} {field("publishedDate", "PUBLISHED DATE", "2026-08-23")}</>}<label className="admin-field full"><span>DESCRIPTION</span><textarea value={form.description ?? ""} onChange={event => update("description", event.target.value)} placeholder="اكتب ملخصًا دقيقًا وقابلًا للتدقيق..." /></label></div><button className="primary-button" onClick={submit} disabled={createCourse.isPending || createTool.isPending || createCve.isPending}><Send size={15} /> PUBLISH TO MATRIX</button></div><div className="admin-table panel-card"><div className="card-head"><div><div className="section-tag">// CONTENT REGISTRY</div><h3>Current knowledge nodes</h3></div><span className="status-chip"><span className="pulse-dot" /> {adminContent.isLoading ? "SYNCING" : "LIVE"}</span></div><div className="registry-grid"><div><span className="registry-label">COURSES</span>{!adminContent.data?.courses.length && <div className="registry-empty">NO COURSE NODES</div>}{adminContent.data?.courses.map(item => <div className="registry-row" key={item.id}><strong>{item.title}</strong><span>{item.category}</span><button onClick={() => deleteCourse.mutate({ id: item.id })}><X size={13} /></button></div>)}</div><div><span className="registry-label">TOOLS</span>{adminContent.data?.tools.map(item => <div className="registry-row" key={item.id}><strong>{item.name}</strong><span>{item.category}</span><button onClick={() => deleteTool.mutate({ id: item.id })}><X size={13} /></button></div>)}</div><div><span className="registry-label">CVE SIGNALS</span>{adminContent.data?.cves.map(item => <div className="registry-row" key={item.id}><strong>{item.cveNumber}</strong><span>{item.severity}</span><button onClick={() => deleteCve.mutate({ id: item.id })}><X size={13} /></button></div>)}</div></div></div></section>;
}
