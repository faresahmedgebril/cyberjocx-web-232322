import { useState, type FormEvent } from "react";
import { Activity, BookOpen, CheckCircle2, FilePlus2, FlaskConical, LockKeyhole, Plus, Send, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function InstructorApplicationView({ isAuthenticated }: { isAuthenticated: boolean }) {
  const status = trpc.instructor.applicationStatus.useQuery(undefined, { enabled: isAuthenticated });
  const [form, setForm] = useState({ expertise: "", teachingExperience: "", portfolioUrl: "", linkedinUrl: "", sampleContentUrl: "" });
  const apply = trpc.instructor.submitApplication.useMutation({
    onSuccess: async () => { await status.refetch(); toast.success("اترسل طلبك للمراجعة. الصلاحية مش هتتفتح غير بعد اعتماد الإدارة."); },
    onError: error => toast.error(error.message || "تعذر إرسال الطلب."),
  });
  const set = (key: keyof typeof form, value: string) => setForm(old => ({ ...old, [key]: value }));

  if (!isAuthenticated) return <section className="module-stack"><header className="admin-hero panel-card"><div className="section-tag">// TEACH WITH CYBERJOCX</div><h2>انضم كمدرّس</h2><p>قدّم خبرتك ومحتوى تدريبي للمراجعة. لازم تسجل دخولك قبل إرسال الطلب.</p></header><div className="empty-state panel-card"><LockKeyhole size={26}/><h3>تسجيل الدخول مطلوب</h3><p>بعد الدخول هتقدر تبعت طلب الانضمام وتتابع حالته.</p><a href="/login" className="primary-button">تسجيل الدخول</a></div></section>;

  if (status.isLoading) return <div className="empty-state panel-card">جارٍ تحميل حالة طلبك...</div>;
  if (status.data?.role === "instructor" || status.data?.role === "admin") return <section className="module-stack"><div className="admin-hero panel-card"><div className="section-tag">// INSTRUCTOR ACCESS</div><h2>صلاحية المدرّس مفعّلة بالفعل</h2><p>افتح Instructor Studio من القائمة لإدارة الدورات والدروس والـLabs.</p></div></section>;
  const application = status.data?.application;
  if (application?.status === "pending") return <section className="module-stack"><div className="admin-hero panel-card"><div className="section-tag">// APPLICATION RECEIVED</div><h2>طلبك تحت المراجعة</h2><p>استلمنا طلب الانضمام يوم {new Date(application.createdAt).toLocaleDateString("ar-EG")}. فريق المنصة هيراجع الخبرة وروابط الأعمال قبل منح الصلاحية.</p><span className="status-chip">PENDING REVIEW</span></div></section>;
  if (application?.status === "approved") return <div className="admin-hero panel-card"><h2>تم اعتماد طلبك</h2><p>صلاحية المدرّس مفعّلة. سجّل خروج ودخول لو Instructor Studio مش ظاهرة.</p></div>;

  return <section className="module-stack">
    <header className="admin-hero panel-card"><div className="section-tag">// INSTRUCTOR ONBOARDING</div><h2>شارك خبرتك. ابنِ مسارًا تدريبيًا.</h2><p>قدّم خبرتك الحقيقية. الطلب مش موافقة تلقائية، والنشر النهائي يفضل خاضع لمراجعة مالك المنصة.</p></header>
    {application?.status === "rejected" && <div className="system-alert"><Activity size={15}/><span>الطلب السابق لم يتم اعتماده: {application.reviewNote || "مفيش ملاحظة مسجلة."} تقدر تعدل بياناتك وتقدم من جديد.</span></div>}
    <form className="admin-editor panel-card" onSubmit={(event: FormEvent) => { event.preventDefault(); apply.mutate(form); }}>
      <div className="card-head"><div><div className="section-tag">// APPLICATION FORM</div><h3>بيانات المدرّس</h3></div><span className="status-chip">OWNER REVIEW REQUIRED</span></div>
      <div className="admin-form-grid">
        <label className="admin-field full"><span>مجال الخبرة</span><input required minLength={3} maxLength={255} value={form.expertise} onChange={event => set("expertise", event.target.value)} placeholder="Penetration Testing / SOC / QA / Cloud Security"/></label>
        <label className="admin-field full"><span>الخبرة العملية والتدريبية</span><textarea required minLength={30} maxLength={5000} value={form.teachingExperience} onChange={event => set("teachingExperience", event.target.value)} placeholder="سنوات الخبرة، الأدوات، المشاريع، الشهادات، وهل سبق لك شرح أو تدريب متعلمين..."/></label>
        <label className="admin-field"><span>Portfolio URL (اختياري)</span><input type="url" value={form.portfolioUrl} onChange={event => set("portfolioUrl", event.target.value)} placeholder="https://..."/></label>
        <label className="admin-field"><span>LinkedIn URL (اختياري)</span><input type="url" value={form.linkedinUrl} onChange={event => set("linkedinUrl", event.target.value)} placeholder="https://linkedin.com/in/..."/></label>
        <label className="admin-field full"><span>عينة محتوى أو شرح (اختياري)</span><input type="url" value={form.sampleContentUrl} onChange={event => set("sampleContentUrl", event.target.value)} placeholder="رابط فيديو أو درس أو GitHub أو مستند"/></label>
      </div>
      <button className="primary-button" type="submit" disabled={apply.isPending || !form.expertise.trim() || form.teachingExperience.trim().length < 30}><Send size={15}/> {apply.isPending ? "جارٍ الإرسال..." : "إرسال طلب الانضمام"}</button>
    </form>
  </section>;
}

export function InstructorStudioView() {
  const dashboard = trpc.instructor.dashboard.useQuery(undefined, { refetchInterval: 30_000 });
  const proposals = trpc.instructor.myLabProposals.useQuery(undefined, { refetchInterval: 30_000 });
  const [courseForm, setCourseForm] = useState({ title: "", slug: "", description: "", category: "Cybersecurity", level: "beginner" as "beginner"|"intermediate"|"advanced", lessons: "8", durationMinutes: "240" });
  const [selectedCourseId, setSelectedCourseId] = useState<number|null>(null);
  const [lessonForm, setLessonForm] = useState({ lessonId: null as number|null, title: "", content: "", orderIndex: "0" });
  const [labForm, setLabForm] = useState({ slug: "", name: "", image: "", description: "", cpuLimit: "1", memoryMb: "512", diskMb: "2048", ttlSeconds: "3600", exposedPorts: "80,443" });
  const lessons = trpc.instructor.listCourseLessons.useQuery({ courseId: selectedCourseId ?? 0 }, { enabled: selectedCourseId !== null });
  const submitCourse = trpc.instructor.submitCourse.useMutation({ onSuccess: () => { void dashboard.refetch(); setCourseForm(old => ({ ...old, title: "", slug: "", description: "" })); toast.success("الدورة اتحفظت كمسودة للمراجعة."); }, onError: error => toast.error(error.message) });
  const saveLesson = trpc.instructor.saveCourseLesson.useMutation({ onSuccess: async () => { await lessons.refetch(); setLessonForm({ lessonId: null, title: "", content: "", orderIndex: "0" }); toast.success("تم حفظ الدرس مشفّرًا."); }, onError: error => toast.error(error.message) });
  const deleteLesson = trpc.instructor.deleteCourseLesson.useMutation({ onSuccess: () => { void lessons.refetch(); toast.success("تم حذف الدرس."); }, onError: error => toast.error(error.message) });
  const uploadAsset = trpc.instructor.requestLessonAssetUpload.useMutation({ onError: error => toast.error(error.message) });
  const proposeLab = trpc.instructor.proposeLabTemplate.useMutation({ onSuccess: async () => { await proposals.refetch(); setLabForm(old => ({ ...old, slug: "", name: "", image: "", description: "" })); toast.success("اترسل اقتراح اللاب للمراجعة، ومش هيظهر قبل الاعتماد."); }, onError: error => toast.error(error.message) });
  const courses = dashboard.data?.courses ?? [];
  const drafts = courses.filter(course => !course.isPublished);
  const totals = dashboard.data?.totals ?? { courses: 0, published: 0, students: 0, averageProgress: 0 };
  const selectedCourse = drafts.find(course => course.id === selectedCourseId);
  const setCourse = (key: keyof typeof courseForm, value: string) => setCourseForm(old => ({ ...old, [key]: value }));
  const setLab = (key: keyof typeof labForm, value: string) => setLabForm(old => ({ ...old, [key]: value }));
  const onAssetChange = async (file?: File) => {
    if (!file || !selectedCourseId || !lessonForm.lessonId) { toast.error("احفظ الدرس الأول وبعدها ارفع الملف."); return; }
    if (!["application/pdf", "video/mp4", "video/webm", "application/zip"].includes(file.type)) { toast.error("نوع الملف غير مدعوم."); return; }
    try {
      const signed = await uploadAsset.mutateAsync({ courseId: selectedCourseId, lessonId: lessonForm.lessonId, fileName: file.name, contentType: file.type as "application/pdf"|"video/mp4"|"video/webm"|"application/zip", sizeBytes: file.size });
      const response = await fetch(signed.uploadUrl, { method: "PUT", headers: signed.headers, body: file });
      if (!response.ok) throw new Error("رفع الملف فشل. راجع إعدادات التخزين وحاول تاني.");
      await lessons.refetch(); toast.success("تم رفع الملف إلى مساحة التخزين.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر رفع الملف."); }
  };

  return <section className="cj-instructor-page module-stack">
    <header className="admin-hero panel-card"><div className="section-tag">// INSTRUCTOR WORKSPACE</div><h2>مساحة المدرّس</h2><p>أنشئ كورسات ومسودات دروس مشفّرة، اقترح بيئات تدريب، وتابع تقدم المتعلمين. النشر النهائي وربط اللابات بالـRoadmap من اختصاص الإدارة.</p></header>
    <div className="admin-metrics">
      <div className="admin-metric panel-card"><BookOpen size={18}/><strong>{totals.courses}</strong><span>MY COURSES</span></div>
      <div className="admin-metric panel-card"><CheckCircle2 size={18}/><strong>{totals.published}</strong><span>PUBLISHED</span></div>
      <div className="admin-metric panel-card"><Users size={18}/><strong>{totals.students}</strong><span>UNIQUE STUDENTS</span></div>
      <div className="admin-metric panel-card"><Activity size={18}/><strong>{totals.averageProgress}%</strong><span>AVERAGE PROGRESS</span></div>
    </div>
    <form className="admin-editor panel-card" onSubmit={(event: FormEvent) => { event.preventDefault(); submitCourse.mutate({ ...courseForm, lessons: Number(courseForm.lessons), durationMinutes: Number(courseForm.durationMinutes) }); }}>
      <div className="card-head"><div><div className="section-tag">// CREATE COURSE DRAFT</div><h3>إنشاء دورة جديدة</h3></div><span className="status-chip">PRIVATE UNTIL APPROVED</span></div>
      <div className="admin-form-grid">
        <label className="admin-field"><span>عنوان الدورة</span><input required minLength={3} value={courseForm.title} onChange={event => setCourse("title", event.target.value)}/></label>
        <label className="admin-field"><span>Slug</span><input required value={courseForm.slug} onChange={event => setCourse("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}/></label>
        <label className="admin-field"><span>التصنيف</span><input required value={courseForm.category} onChange={event => setCourse("category", event.target.value)}/></label>
        <label className="admin-field"><span>المستوى</span><select value={courseForm.level} onChange={event => setCourse("level", event.target.value as typeof courseForm.level)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
        <label className="admin-field"><span>عدد الدروس المتوقع</span><input type="number" min="1" max="500" value={courseForm.lessons} onChange={event => setCourse("lessons", event.target.value)}/></label>
        <label className="admin-field"><span>المدة بالدقائق</span><input type="number" min="1" value={courseForm.durationMinutes} onChange={event => setCourse("durationMinutes", event.target.value)}/></label>
        <label className="admin-field full"><span>وصف الدورة (20 حرف على الأقل)</span><textarea required minLength={20} value={courseForm.description} onChange={event => setCourse("description", event.target.value)}/></label>
      </div>
      <button type="submit" className="primary-button" disabled={submitCourse.isPending}><Plus size={15}/> إنشاء مسودة الدورة</button>
    </form>
    <section className="admin-table panel-card">
      <div className="card-head"><div><div className="section-tag">// MY COURSE LIBRARY</div><h3>دوراتي</h3></div><span>{courses.length} courses</span></div>
      {!courses.length ? <p>لسه معندكش دورات. أنشئ أول مسودة من النموذج.</p> : courses.map(course => <div className="cj-admin-review-row" key={course.id}><div><strong>{course.title}</strong><small>{course.category} · {course.level} · {course.lessons} درس</small></div><span className={course.isPublished ? "status-published" : "status-chip"}>{course.isPublished ? "PUBLISHED" : "DRAFT / REVIEW"}</span>{!course.isPublished && <button className="small-button" onClick={() => { setSelectedCourseId(course.id); setLessonForm({ lessonId: null, title: "", content: "", orderIndex: "0" }); }}>إدارة الدروس</button>}</div>)}
    </section>
    {selectedCourse && <section className="admin-editor panel-card">
      <div className="card-head"><div><div className="section-tag">// ENCRYPTED LESSON BUILDER</div><h3>{selectedCourse.title}</h3><p>محتوى الدرس بيتشفّر في السيرفر باستخدام AES-256-GCM قبل التخزين.</p></div><span className="status-chip">ENCRYPTED AT REST</span></div>
      <div className="admin-form-grid">
        <label className="admin-field"><span>عنوان الدرس</span><input value={lessonForm.title} onChange={event => setLessonForm(old => ({ ...old, title: event.target.value }))}/></label>
        <label className="admin-field"><span>ترتيب الدرس</span><input type="number" min="0" value={lessonForm.orderIndex} onChange={event => setLessonForm(old => ({ ...old, orderIndex: event.target.value }))}/></label>
        <label className="admin-field full"><span>محتوى الدرس</span><textarea rows={8} value={lessonForm.content} onChange={event => setLessonForm(old => ({ ...old, content: event.target.value }))} placeholder="اكتب المحتوى التدريبي هنا..."/></label>
      </div>
      <div className="admin-actions"><button className="primary-button" disabled={saveLesson.isPending || lessonForm.content.trim().length < 20 || lessonForm.title.trim().length < 3} onClick={() => saveLesson.mutate({ courseId: selectedCourse.id, lessonId: lessonForm.lessonId ?? undefined, title: lessonForm.title, content: lessonForm.content, orderIndex: Number(lessonForm.orderIndex) })}><FilePlus2 size={15}/> حفظ الدرس المشفّر</button><button type="button" className="small-button" onClick={() => setSelectedCourseId(null)}>إغلاق المحرر</button></div>
      <div className="registry-grid"><div><span className="registry-label">LESSONS</span>{lessons.isLoading ? <p>جارٍ تحميل الدروس...</p> : lessons.data?.length ? lessons.data.map(lesson => <div className="registry-row" key={lesson.id}><button className="tool-link" onClick={() => setLessonForm({ lessonId: lesson.id, title: lesson.title, content: lesson.content, orderIndex: String(lesson.orderIndex) })}>{lesson.title}</button><span>{lesson.hasAsset ? "ASSET ATTACHED" : "TEXT ONLY"}</span><button title="حذف الدرس" onClick={() => deleteLesson.mutate({ courseId: selectedCourse.id, lessonId: lesson.id })}><Trash2 size={13}/></button></div>) : <p>مفيش دروس لسه.</p>}</div></div>
      {lessonForm.lessonId && <label className="admin-field full"><span>ملف الدرس (PDF / MP4 / WEBM / ZIP حتى 500MB)</span><input type="file" accept=".pdf,.mp4,.webm,.zip" onChange={event => void onAssetChange(event.target.files?.[0])}/><small>ارفع الملف بعد حفظ الدرس. الرابط اللي هيوصل للطالب مؤقت بعد نشر الدورة.</small></label>}
    </section>}
    <form className="admin-editor panel-card" onSubmit={(event: FormEvent) => { event.preventDefault(); proposeLab.mutate({ ...labForm, cpuLimit: Number(labForm.cpuLimit), memoryMb: Number(labForm.memoryMb), diskMb: Number(labForm.diskMb), ttlSeconds: Number(labForm.ttlSeconds), exposedPorts: labForm.exposedPorts.split(",").map(value => Number(value.trim())).filter(Number.isInteger) }); }}>
      <div className="card-head"><div><div className="section-tag">// LAB TEMPLATE PROPOSAL</div><h3>اقتراح بيئة تدريب</h3></div><span className="status-chip">OWNER REVIEW REQUIRED</span></div>
      <div className="admin-form-grid">
        <label className="admin-field"><span>اسم البيئة</span><input required value={labForm.name} onChange={event => setLab("name", event.target.value)}/></label>
        <label className="admin-field"><span>Slug</span><input required value={labForm.slug} onChange={event => setLab("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}/></label>
        <label className="admin-field full"><span>Container image</span><input required type="url" value={labForm.image} onChange={event => setLab("image", event.target.value)} placeholder="https://registry.example/image:tag"/></label>
        <label className="admin-field full"><span>الوصف والهدف التعليمي</span><textarea required minLength={20} value={labForm.description} onChange={event => setLab("description", event.target.value)}/></label>
        <label className="admin-field"><span>CPU</span><input type="number" min="1" max="8" value={labForm.cpuLimit} onChange={event => setLab("cpuLimit", event.target.value)}/></label>
        <label className="admin-field"><span>RAM MB</span><input type="number" min="256" max="16384" value={labForm.memoryMb} onChange={event => setLab("memoryMb", event.target.value)}/></label>
        <label className="admin-field"><span>Disk MB</span><input type="number" min="512" max="65536" value={labForm.diskMb} onChange={event => setLab("diskMb", event.target.value)}/></label>
        <label className="admin-field"><span>TTL seconds</span><input type="number" min="300" max="14400" value={labForm.ttlSeconds} onChange={event => setLab("ttlSeconds", event.target.value)}/></label>
        <label className="admin-field full"><span>Exposed ports (comma-separated)</span><input value={labForm.exposedPorts} onChange={event => setLab("exposedPorts", event.target.value)}/></label>
      </div>
      <button type="submit" className="primary-button" disabled={proposeLab.isPending}><FlaskConical size={15}/> إرسال اقتراح اللاب</button>
    </form>
    <section className="admin-table panel-card"><div className="card-head"><div><div className="section-tag">// LAB PROPOSALS</div><h3>اقتراحاتي للـLabs</h3></div><span>{proposals.data?.length ?? 0} proposals</span></div>{proposals.data?.length ? proposals.data.map(item => <div className="cj-admin-review-row" key={item.id}><div><strong>{item.name}</strong><small>{item.slug} · {new Date(item.createdAt).toLocaleDateString()}</small></div><span className="status-chip">{item.reviewStatus.toUpperCase()}</span></div>) : <p>مفيش اقتراحات Labs حتى الآن.</p>}</section>
    <section className="admin-table panel-card"><div className="card-head"><div><div className="section-tag">// STUDENT PROGRESS</div><h3>متابعة المتعلمين</h3></div></div>{dashboard.data?.students?.length ? dashboard.data.students.map((student, index) => <div className="cj-admin-review-row" key={student.courseId + "-" + student.userId + "-" + index}><div><strong>{student.studentName || student.studentEmail || "Student"}</strong><small>{courses.find(course => course.id === student.courseId)?.title ?? "Course"} · {student.completed ? "Completed" : "In progress"}</small></div><span>{student.progress}%</span></div>) : <p>لسه مفيش تقدم مسجل في الدورات بتاعتك.</p>}</section>
  </section>;
}
