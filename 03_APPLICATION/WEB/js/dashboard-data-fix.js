import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const statusText=v=>({BACKLOG:"Backlog",TODO:"Chờ xử lý",IN_PROGRESS:"Đang thực hiện",REVIEW:"Đang review",DONE:"Hoàn thành"}[v]||"Chưa xác định");
const progress=t=>{const p={DONE:100,REVIEW:75,IN_PROGRESS:50,TODO:0,BACKLOG:0}[t.status];return p!==undefined?p:(Number(t.progress)||0)};
const dateKey=v=>{if(!v)return"";const d=typeof v?.toDate==="function"?v.toDate():new Date(v);if(Number.isNaN(d.getTime()))return"";return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const toDateKey=v=>dateKey(v);

onAuthStateChanged(auth,async user=>{
 if(!user)return;
 try{
  const identity=await safe(()=>getDocs(query(collection(db,"identities"),where("status","==","ACTIVE"),limit(100))));
  const own=identity?.docs.find(d=>d.id===user.uid)?.data()||{};
  const name=own.fullName||own.displayName||own.name||user.displayName||user.email?.split("@")[0]||"Thành viên";
  if($("#userIdentity"))$("#userIdentity").textContent=name;
  if($("#topbarIdentity"))$("#topbarIdentity").textContent=name;
  const membership=await safe(()=>getDocs(query(collection(db,"memberships"),where("identityId","==",user.uid),limit(1))));
  const m=membership?.docs[0]?.data()||{};
  const roles=m.roles||{};const org=Array.isArray(roles.organization)?roles.organization:[];const sys=Array.isArray(roles.system)?roles.system:[];
  if($(".user-info span"))$(".user-info span").textContent=sys.includes("system_admin")?"System Administrator":({admin:"Administrator",org_admin:"Organization Administrator",organization_admin:"Organization Administrator",manager:"Manager",org_manager:"Organization Manager"}[org[0]]||"Thành viên");
  const tasks=await loadTasks(user.uid);render(tasks);
 }catch(error){console.error("Dashboard member data fix:",error);const note=$(".risk-note");if(note)note.innerHTML=`<span>!</span> Không tải được Work: ${esc(error?.code||error?.message||"Firestore error")}`;}
});

async function safe(make){try{return await make()}catch(e){console.warn("Dashboard query skipped:",e?.code||e);return null}}
async function loadTasks(uid){
 const map=new Map();
 for(const make of [
  ()=>getDocs(query(collection(db,"workTasks"),where("assigneeIds","array-contains",uid),limit(100))),
  ()=>getDocs(query(collection(db,"workTasks"),where("assigneeId","==",uid),limit(100))),
  ()=>getDocs(query(collection(db,"workTasks"),where("createdBy","==",uid),limit(100)))
 ]){const s=await safe(make);s?.docs.forEach(d=>map.set(d.id,{id:d.id,...d.data()}))}
 return[...map.values()];
}
function render(tasks){
 const today=dateKey(new Date()),done=tasks.filter(t=>t.status==="DONE").length,active=tasks.filter(t=>t.status==="IN_PROGRESS").length,waiting=tasks.filter(t=>["BACKLOG","TODO","REVIEW"].includes(t.status)).length,overdue=tasks.filter(t=>toDateKey(t.dueDate)&&toDateKey(t.dueDate)<today&&t.status!=="DONE").length,score=tasks.length?Math.round(tasks.reduce((a,t)=>a+progress(t),0)/tasks.length):0;
 const cards=document.querySelectorAll(".metric-card");if(cards[0])cards[0].querySelector("strong").textContent=done;if(cards[1])cards[1].querySelector("strong").textContent=overdue;if(cards[2]){cards[2].querySelector("strong").textContent=`${score}%`;cards[2].querySelector(".metric-head b").textContent=`${score}%`;const bar=cards[2].querySelector(".progress-line i");if(bar)bar.style.width=`${score}%`}
 const sums=document.querySelectorAll(".work-summary > div strong");if(sums[0])sums[0].textContent=String(active).padStart(2,"0");if(sums[1])sums[1].textContent=String(done).padStart(2,"0");if(sums[2])sums[2].textContent=String(waiting).padStart(2,"0");
 const ring=$(".work-ring");if(ring){ring.style.background=`conic-gradient(#2587ff 0 ${score}%, #ffffff0e ${score}% 100%)`;const r=ring.querySelector("strong");if(r)r.textContent=`${score}%`}
 const list=$("#work .task-list");if(list){const rows=[...tasks].sort((a,b)=>(toDateKey(a.dueDate)||"9999").localeCompare(toDateKey(b.dueDate)||"9999")).slice(0,5);list.innerHTML=rows.length?rows.map(t=>`<div class="task-item"><i class="task-dot ${t.status==="DONE"?"blue-dot":t.status==="IN_PROGRESS"?"green-dot":t.priority==="URGENT"?"red-dot":"blue-dot"}"></i><div><strong>${esc(t.title||"Không tên")}</strong><span>${esc(statusText(t.status))}</span></div><b>${progress(t)}%</b></div>`).join(""):`<div class="task-item"><i class="task-dot blue-dot"></i><div><strong>Chưa có công việc</strong><span>Không có Work được giao hoặc tự tạo</span></div><b>—</b></div>`}
 const todayList=$(".today-list");if(todayList){const rows=tasks.filter(t=>toDateKey(t.dueDate)===today).slice(0,5);todayList.innerHTML=rows.length?rows.map(t=>`<div><i class="check">${t.status==="DONE"?"✓":"•"}</i><span>${esc(t.title||"Không tên")}</span><time>${t.status==="DONE"?"Xong":"Hôm nay"}</time></div>`).join(""):`<div><i class="check">✓</i><span>Không có công việc đến hạn hôm nay</span><time>—</time></div>`}
 const p=$(".report-card .report-copy p:not(.eyebrow)");if(p)p.textContent=`Đang theo dõi ${tasks.length} công việc từ Work. Tiến độ hiện tại ${score}%, ${done} đã hoàn thành và ${overdue} quá hạn.`;
 const ul=$(".report-card .report-copy ul");if(ul)ul.innerHTML=`<li>${active} công việc đang thực hiện.</li><li>${waiting} công việc chờ xử lý/review.</li><li>${overdue} công việc quá hạn.</li>`;
 const risk=$(".risk-note");if(risk)risk.innerHTML=`<span>!</span> ${overdue} công việc quá hạn trong phạm vi tài khoản.`;
}
