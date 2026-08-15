import './permissions.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const userIdentity = document.getElementById("userIdentity");
const topbarIdentity = document.getElementById("topbarIdentity");
const welcomeIdentity = document.getElementById("welcomeIdentity");
const logoutButton = document.getElementById("logoutButton");
const currentDate = document.getElementById("currentDate");
const userRoleText = document.querySelector(".user-info span");

function isPrivilegedMembership(membership) {
    const roles = membership?.roles || {};
    const systemRoles = Array.isArray(roles.system) ? roles.system : [];
    const organizationRoles = Array.isArray(roles.organization) ? roles.organization : [];
    return systemRoles.includes("system_admin") || systemRoles.includes("admin") || organizationRoles.some(role => ["org_admin", "organization_admin", "admin", "manager", "org_manager"].includes(role));
}

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "index.html"; return; }
    try {
        updateUI("", "Đang tải dữ liệu...");
        const identityRef = doc(db, "identities", user.uid);
        let identitySnap = await getDoc(identityRef);
        if (!identitySnap.exists()) {
            try {
                await setDoc(identityRef, { fullName: user.displayName || user.email?.split("@")[0] || "Thành viên", email: user.email || "", status: "ACTIVE", createdAt: new Date().toISOString() }, { merge: true });
                identitySnap = await getDoc(identityRef);
            } catch (identityWriteError) {
                console.warn("Không thể tự tạo identity, tiếp tục bằng Auth:", identityWriteError?.code || identityWriteError);
            }
        }
        const identityData = identitySnap.exists() ? identitySnap.data() : {};
        const membershipSnap = await getDoc(doc(db, "memberships", `mem_${user.uid}_org_saovn_01`));
        if (!membershipSnap.exists()) throw new Error("Không tìm thấy Membership của tài khoản.");
        const membership = membershipSnap.data();
        updateUI(identityData.fullName || identityData.displayName || user.displayName || user.email?.split("@")[0] || "Thành viên", getDisplayRole(membership));
        await loadWorkDashboard(user.uid, isPrivilegedMembership(membership));
    } catch (error) {
        console.error("Lỗi kéo dữ liệu từ Firestore:", error);
        updateUI("", error?.code === "permission-denied" ? "Không đủ quyền truy cập Firestore" : "Không thể tải dữ liệu");
        showDashboardError(error?.message || "Không thể tải dữ liệu Dashboard.");
    }
});

function getDisplayRole(membership) {
    const roles = membership?.roles || {};
    if (roles?.system?.includes("system_admin")) return "System Administrator";
    const roleMap = { org_admin: "Organization Administrator", organization_admin: "Organization Administrator", admin: "Administrator", org_manager: "Organization Manager", manager: "Manager", member: "Thành viên" };
    const role = Array.isArray(roles.organization) ? roles.organization[0] : "member";
    return roleMap[role] || String(role).replaceAll("_", " ");
}
function updateUI(name, roleInfo) {
    if (userIdentity) userIdentity.textContent = name;
    if (topbarIdentity) topbarIdentity.textContent = name;
    if (welcomeIdentity) welcomeIdentity.textContent = "";
    if (userRoleText) userRoleText.textContent = roleInfo;
    document.querySelector(".hero-banner")?.remove();
}

async function safeTaskQuery(factory, label) {
    try { return await factory(); }
    catch (error) { console.warn(`Dashboard query ${label} skipped:`, error?.code || error); return null; }
}

async function loadWorkDashboard(uid, privileged) {
    const unique = new Map();
    const add = snap => snap?.docs?.forEach(item => unique.set(item.id, { id: item.id, ...item.data() }));

    if (privileged) {
        const all = await safeTaskQuery(() => getDocs(collection(db, "workTasks")), "all");
        add(all);
    } else {
        // Do not use Promise.all here: one legacy/permission-limited query must not
        // prevent the member from seeing tasks assigned through the canonical field.
        add(await safeTaskQuery(() => getDocs(query(collection(db, "workTasks"), where("assigneeIds", "array-contains", uid))), "assigneeIds"));
        add(await safeTaskQuery(() => getDocs(query(collection(db, "workTasks"), where("createdBy", "==", uid))), "createdBy"));
        // Legacy field is best-effort only. New tasks always use assigneeIds.
        add(await safeTaskQuery(() => getDocs(query(collection(db, "workTasks"), where("assigneeId", "==", uid))), "legacy assigneeId"));
    }

    const tasks = [...unique.values()];
    const today = new Date();
    const todayKey = dateKey(today);
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === "IN_PROGRESS").length;
    const done = tasks.filter(t => t.status === "DONE").length;
    const overdue = tasks.filter(t => toDateKey(t.dueDate) && toDateKey(t.dueDate) < todayKey && t.status !== "DONE").length;
    const waiting = tasks.filter(t => ["BACKLOG", "TODO", "REVIEW"].includes(t.status)).length;
    const score = total ? Math.round(tasks.reduce((sum, t) => sum + progressForTask(t), 0) / total) : 0;
    updateMetricCards({ done, overdue, score });
    updateWorkSummary({ inProgress, done, waiting, score });
    renderDashboardTasks(tasks);
    renderTodayTasks(tasks, todayKey);
    renderMonthlyChart(tasks, today);
    renderRisk(tasks);
    renderReportCard({ total, done, inProgress, waiting, overdue, score });
    renderEmptySecondaryPanels();
}

function updateMetricCards({ done, overdue, score }) { const cards=document.querySelectorAll(".metric-card"); if(cards[0]){cards[0].querySelector("strong").textContent=done;cards[0].querySelector("small").textContent="Theo dữ liệu Work hiện tại";cards[0].querySelector(".metric-head b").textContent="LIVE";} if(cards[1]){cards[1].querySelector("strong").textContent=overdue;cards[1].querySelector("small").textContent="Chưa hoàn thành và đã quá hạn";cards[1].querySelector(".metric-head b").textContent=overdue?"CẦN XỬ LÝ":"ỔN ĐỊNH";} if(cards[2]){cards[2].querySelector("strong").textContent=`${score}%`;cards[2].querySelector(".metric-head b").textContent=`${score}%`;cards[2].querySelector("small").textContent="Tính từ trạng thái công việc";cards[2].querySelector(".progress-line i").style.width=`${score}%`;}}
function updateWorkSummary({ inProgress, done, waiting, score }) { const summary=document.querySelectorAll(".work-summary > div strong");if(summary[0])summary[0].textContent=String(inProgress).padStart(2,"0");if(summary[1])summary[1].textContent=String(done).padStart(2,"0");if(summary[2])summary[2].textContent=String(waiting).padStart(2,"0");const ring=document.querySelector(".work-ring");if(ring)ring.style.background=`conic-gradient(#2587ff 0 ${score}%, #ffffff0e ${score}% 100%)`;if(ring?.querySelector("strong"))ring.querySelector("strong").textContent=`${score}%`;}
function renderDashboardTasks(tasks) { const list=document.querySelector("#work .task-list");if(!list)return;const statusText={BACKLOG:"Backlog",TODO:"Chờ xử lý",IN_PROGRESS:"Đang thực hiện",REVIEW:"Đang review",DONE:"Hoàn thành"};const sorted=[...tasks].sort((a,b)=>(toDateKey(a.dueDate)||"9999").localeCompare(toDateKey(b.dueDate)||"9999")).slice(0,5);list.innerHTML=sorted.length?sorted.map(t=>{const color=t.status==="DONE"?"blue-dot":t.status==="IN_PROGRESS"?"green-dot":t.status==="REVIEW"?"orange-dot":t.priority==="URGENT"?"red-dot":"blue-dot";return `<div class="task-item"><i class="task-dot ${color}"></i><div><strong>${escapeHTML(t.title||"Không tên")}</strong><span>${statusText[t.status]||"Chưa xác định"}</span></div><b>${progressForTask(t)}%</b></div>`;}).join(""):emptyTask("Chưa có công việc","Chưa có dữ liệu Work trong phạm vi của bạn");}
function renderTodayTasks(tasks,today){const list=document.querySelector(".today-list");if(!list)return;const todayTasks=tasks.filter(t=>toDateKey(t.dueDate)===today).slice(0,5);list.innerHTML=todayTasks.length?todayTasks.map(t=>`<div><i class="check">${t.status==="DONE"?"✓":"•"}</i><span>${escapeHTML(t.title||"Không tên")}</span><time>${t.status==="DONE"?"Xong":"Hôm nay"}</time></div>`).join(""):`<div><i class="check">✓</i><span>Không có công việc đến hạn hôm nay</span><time>—</time></div>`;}
function renderMonthlyChart(tasks,today){const chart=document.querySelector(".bar-chart");if(!chart)return;const months=[];for(let i=5;i>=0;i--){const d=new Date(today.getFullYear(),today.getMonth()-i,1);months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:`${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`});}const counts=months.map(m=>tasks.filter(t=>toDateKey(t.completedAt||t.updatedAt||t.createdAt)?.startsWith(m.key)&&t.status==="DONE").length);const max=Math.max(...counts,1);chart.innerHTML=months.map((m,i)=>{const value=counts[i],height=Math.max(4,Math.round(value/max*92));return `<div><span>${value}</span><i style="height:${height}%"></i><small>${m.label}</small></div>`;}).join("");}
function renderRisk(tasks){const rows=document.querySelectorAll(".risk-bars > div");if(!rows.length)return;const total=tasks.length||1;const overdue=tasks.filter(t=>toDateKey(t.dueDate)&&toDateKey(t.dueDate)<dateKey(new Date())&&t.status!=="DONE").length;const attention=tasks.filter(t=>["REVIEW","IN_PROGRESS"].includes(t.status)&&t.priority==="URGENT").length;const onTrack=Math.max(0,total-overdue-attention);const values=[Math.round(onTrack/total*100),Math.round(attention/total*100),Math.round(overdue/total*100)];["Đúng tiến độ","Cần chú ý","Trễ hạn"].forEach((label,i)=>{const row=rows[i];if(!row)return;row.querySelector("span").textContent=label;const bar=row.querySelector("b");bar.textContent=`${values[i]}%`;bar.style.width=`${values[i]}%`;});const note=document.querySelector(".risk-note");if(note)note.innerHTML=`<span>!</span> ${overdue} công việc quá hạn trong phạm vi hiện tại.`;}
function renderReportCard({total,done,inProgress,waiting,overdue,score}){const copy=document.querySelector(".report-card .report-copy");if(!copy)return;copy.querySelector("h1").textContent="Tổng quan công việc";const p=copy.querySelector("p:not(.eyebrow)");if(p)p.textContent=`Đang theo dõi ${total} công việc trong phạm vi quyền của tài khoản. Tiến độ hiện tại ${score}%, ${done} công việc đã hoàn thành và ${overdue} công việc quá hạn.`;const ul=copy.querySelector("ul");if(ul)ul.innerHTML=`<li>${inProgress} công việc đang thực hiện.</li><li>${waiting} công việc đang chờ xử lý/review.</li><li>${overdue?`${overdue} công việc cần ưu tiên xử lý.`:"Không có công việc quá hạn."}</li>`;}
function renderEmptySecondaryPanels(){const noticeList=document.querySelector(".notice-list");if(noticeList)noticeList.innerHTML=`<div><i class="notice-dot blue-dot"></i><span><strong>Thông báo</strong> sẽ xuất hiện khi module Notifications được kết nối<small>Chưa có dữ liệu</small></span></div>`;const count=document.querySelector(".count-badge");if(count)count.textContent="0";const docList=document.querySelector(".doc-list");if(docList)docList.innerHTML=`<div><i class="doc-icon blue-doc">D</i><span>Chưa có tài liệu gần đây<small>Documents chưa được kết nối</small></span><time>—</time></div>`;}
function showDashboardError(message){const card=document.querySelector(".report-card .report-copy p:not(.eyebrow)");if(card)card.textContent=message;}
function progressForTask(task){const stateProgress={DONE:100,REVIEW:75,IN_PROGRESS:50,TODO:0,BACKLOG:0}[task.status];return stateProgress!==undefined?stateProgress:(Number(task.progress)||0);}
function dateKey(date){const d=date instanceof Date?date:new Date(date);if(Number.isNaN(d.getTime()))return "";return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function toDateKey(value){if(!value)return "";if(typeof value==="object"&&typeof value.toDate==="function")return dateKey(value.toDate());return dateKey(value);}
function emptyTask(title,detail){return `<div class="task-item"><i class="task-dot blue-dot"></i><div><strong>${escapeHTML(title)}</strong><span>${escapeHTML(detail)}</span></div><b>—</b></div>`;}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));}
if(logoutButton)logoutButton.addEventListener("click",()=>signOut(auth).catch(error=>console.error("Lỗi khi đăng xuất:",error)));
if(currentDate)currentDate.textContent=new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date());
document.querySelectorAll('a[href="#work"]').forEach(link=>link.addEventListener("click",e=>{e.preventDefault();window.location.href="work.html";}));
document.querySelectorAll('a[href="#"]').forEach(link=>link.addEventListener("click",e=>e.preventDefault()));
const workReportModal=document.getElementById("workReportModal");const openReportBtn=document.getElementById("openReportBtn");const closeReportBtn=document.getElementById("closeReportBtn");if(workReportModal&&openReportBtn&&closeReportBtn){openReportBtn.addEventListener("click",e=>{e.preventDefault();window.location.href="work.html";});closeReportBtn.addEventListener("click",()=>workReportModal.classList.remove("active"));workReportModal.addEventListener("click",e=>{if(e.target===workReportModal)workReportModal.classList.remove("active");});}
