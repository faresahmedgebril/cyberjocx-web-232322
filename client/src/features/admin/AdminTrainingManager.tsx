import { useState } from "react";
import { Check, GitBranch, GraduationCap, FlaskConical, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdminTrainingManager() {
  const applications = trpc.admin.instructorApplicationQueue.useQuery(undefined, { refetchInterval: 30_000 });
  const labs = trpc.admin.labProposalQueue.useQuery(undefined, { refetchInterval: 30_000 });
  const options = trpc.admin.roadmapLinkOptions.useQuery();
  const reviewApplication = trpc.admin.reviewInstructorApplication.useMutation({ onSuccess: () => { void applications.refetch(); toast.success("تم تسجيل قرار طلب المدرّس."); }, onError: error => toast.error(error.message) });
  const reviewLab = trpc.admin.reviewLabProposal.useMutation({ onSuccess: () => { void labs.refetch(); void options.refetch(); toast.success("تم تحديث حالة اقتراح اللاب."); }, onError: error => toast.error(error.message) });
  const link = trpc.admin.linkRoadmapModule.useMutation({ onSuccess: () => { void options.refetch(); toast.success("تم ربط الـModule بالـCourse والـLab."); }, onError: error => toast.error(error.message) });
  const [moduleId, setModuleId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [labId, setLabId] = useState("");
  const modules = options.data?.modules ?? [];
  const selectedModule = modules.find(item => item.id === Number(moduleId));
  const level = options.data?.levels.find(item => item.id === selectedModule?.trackLevelId);
  const track = options.data?.tracks.find(item => item.id === level?.trackId);
  const courseName = (id: number|null) => options.data?.courses.find(item => item.id === id)?.title ?? "Not linked";
  const labName = (id: number|null) => options.data?.labs.find(item => item.id === id)?.name ?? "Not linked";

  return <section className="module-stack cj-admin-training-manager">
    <section className="admin-table panel-card"><div className="card-head"><div><div className="section-tag">// INSTRUCTOR APPROVALS</div><h3><GraduationCap size={17}/> طلبات اعتماد المدرّسين</h3></div><span>{applications.data?.length ?? 0} pending</span></div>
      {applications.isLoading ? <p>جارٍ تحميل الطلبات...</p> : applications.error ? <p>قائمة طلبات المدرّسين متاحة لمالك المنصة فقط.</p> : applications.data?.length ? applications.data.map(item => <article className="cj-admin-review-row is-change" key={item.id}>
        <div><strong>{item.name || "No display name"} · {item.email || "No email"}</strong><small>{item.expertise} · {new Date(item.createdAt).toLocaleString()}</small><p>{item.teachingExperience}</p><small>{item.portfolioUrl || "No portfolio"}{item.linkedinUrl ? " · " + item.linkedinUrl : ""}{item.sampleContentUrl ? " · Sample: " + item.sampleContentUrl : ""}</small></div>
        <div className="admin-actions"><button className="primary-button compact" disabled={reviewApplication.isPending} onClick={() => reviewApplication.mutate({ applicationId: item.id, decision: "approve" })}><Check size={14}/> اعتماد</button><button className="small-button" disabled={reviewApplication.isPending} onClick={() => reviewApplication.mutate({ applicationId: item.id, decision: "reject", note: "Please provide stronger evidence of subject expertise or teaching experience." })}><X size={14}/> رفض</button></div>
      </article>) : <p>لا توجد طلبات pending.</p>}
    </section>
    <section className="admin-table panel-card"><div className="card-head"><div><div className="section-tag">// LAB ENVIRONMENT REVIEW</div><h3><FlaskConical size={17}/> اقتراحات بيئات التدريب</h3></div><span>{labs.data?.length ?? 0} pending</span></div>
      {labs.isLoading ? <p>جارٍ تحميل اقتراحات المختبرات...</p> : labs.error ? <p>مراجعة المختبرات متاحة لمالك المنصة فقط.</p> : labs.data?.length ? labs.data.map(item => <article className="cj-admin-review-row is-change" key={item.id}>
        <div><strong>{item.name} ({item.slug})</strong><small>{item.instructorName || item.instructorEmail || "Instructor"} · {item.cpuLimit} CPU · {item.memoryMb} MB RAM · {item.diskMb} MB disk</small><p>{item.description}</p><small>{item.image} · ports {item.exposedPortsJson}</small></div>
        <div className="admin-actions"><button className="primary-button compact" disabled={reviewLab.isPending} onClick={() => reviewLab.mutate({ labTemplateId: item.id, decision: "approve" })}><Check size={14}/> اعتماد</button><button className="small-button" disabled={reviewLab.isPending} onClick={() => reviewLab.mutate({ labTemplateId: item.id, decision: "reject" })}><X size={14}/> رفض</button></div>
      </article>) : <p>مفيش اقتراحات Labs pending.</p>}
    </section>
    <section className="admin-editor panel-card"><div className="card-head"><div><div className="section-tag">// ROADMAP GRAPH / CONTENT LINKS</div><h3><GitBranch size={17}/> ربط كل Module بالكورس واللاب</h3></div><span className="status-chip">OWNER ONLY</span></div>
      <p>اختار Track ثم Module، واربطه بكورس وبيئة تدريب. الربط بيتحفظ على نفس سجل وحدة الـRoadmap.</p>
      <div className="admin-form-grid">
        <label className="admin-field full"><span>Roadmap module</span><select value={moduleId} onChange={event => { setModuleId(event.target.value); const row = modules.find(item => item.id === Number(event.target.value)); setCourseId(row?.courseId ? String(row.courseId) : ""); setLabId(row?.labTemplateId ? String(row.labTemplateId) : ""); }}><option value="">اختار Module</option>{modules.map(item => { const l = options.data?.levels.find(levelRow => levelRow.id === item.trackLevelId); const t = options.data?.tracks.find(trackRow => trackRow.id === l?.trackId); return <option key={item.id} value={item.id}>{t?.title || "Track"} / {l?.title || "Level"} / {item.title}</option>; })}</select></label>
        <label className="admin-field"><span>Course</span><select value={courseId} onChange={event => setCourseId(event.target.value)}><option value="">No course</option>{(options.data?.courses ?? []).map(item => <option key={item.id} value={item.id}>{item.title}{item.isPublished ? "" : " (Draft)"}</option>)}</select></label>
        <label className="admin-field"><span>Lab environment</span><select value={labId} onChange={event => setLabId(event.target.value)}><option value="">No lab</option>{(options.data?.labs ?? []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      </div>
      {selectedModule && <div className="system-alert"><GitBranch size={15}/><span>{track?.title || "Track"} / {level?.title || "Level"} / {selectedModule.title} — Course: {courseName(selectedModule.courseId)} — Lab: {labName(selectedModule.labTemplateId)}</span></div>}
      <button className="primary-button" disabled={!moduleId || link.isPending} onClick={() => link.mutate({ moduleId: Number(moduleId), courseId: courseId ? Number(courseId) : null, labTemplateId: labId ? Number(labId) : null })}>حفظ الربط</button>
    </section>
  </section>;
}
