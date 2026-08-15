import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const q = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const status = { BACKLOG:"Backlog", TODO:"Chờ xử lý", IN_PROGRESS:"Đang thực hiện", REVIEW:"Đang review", DONE:"Hoàn thành" };
const progress = t => ({DONE:100,REVIEW:75,IN_PROGRESS:50,TODO:0,BACKLOG:0}[t.status] ?? Number(t.progress) || 0);
function dateKey(v){if(!v)return "";const d=typeof v?.toDate==="function"?v.toDate():new Date(v);if(Number.isNaN(d.getTime()))return "";return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}

onAuthStateChanged(auth, async user => {
  if(!user)return;
  try{
    const tasks=await loadTasks(user.uid);
    render(tasks);
    console.info("SAOVN Dashboard member fix: loaded",tasks.length,"tasks");
  }catch(error){
    console.error("SAOVN Dashboard member fix:",error);
    const note=q(".risk-note");
    if(note)note.innerHTML=`<span>!</span> Dashboard chưa đọc được Work: ${esc(error?.code||error?.message||"Firestore error")}`;
  }
});

async function one(make){try{return await make();}catch(error){console.warn("Dashboard member query skipped:",error?.code||error);return null;}}
async function loadTasks(uid){
  const map=new Map();
  const assigned=await one(()=>getDocs(query(collection(db,"workTasks"),where("assigneeIds","array-contains",uid),limit(100))));
  assigned?.docs.forEach(d=>map.set(d.id,{id:d.id,...d.data()}));
  const legacy=await one(()=>getDocs(query(collection(db,"workTasks"),where("assigneeId","==",uid),limit(100))));
  legacy?.docs.forEach(d=>map.set(d.id,{id:d.id,...d.data()}));
  const owned=await one(()=>getDocs(query(collection(db,"workTasks"),where("createdBy","==",uid),limit(100))));
  owned?.docs.forEach(d=>map.set(d.id,{id:d.id,...d.data()}));
  return [...map.values()];
}

function render(tasks){
  const today=dateKey(new Date());
  const done=tasks.filter(t=>t.status==="DONE").length;
  const active=tasks.filter(t=>t.status==="IN_PROGRESS").length;
  const waiting=tasks.filter(t=>["BACKLOG","TODO","REVIEW"].includes(t.status)).length;
  const overdue=tasks.filter(t=>dateKey(t.dueDate)&&dateKey(t.dueDate)<today&&t.status!=="DONE").length;
  const score=tasks.length?Math.round(tasks.reduce((a,t)=>a+progress(t),0)/tasks.length):0;
  const cards=document.querySelectorAll(".metric-card");
  if(cards[0])cards[0].querySelector("strong").textContent=done;
  if(cards[1])cards[1].querySelector("strong").textContent=overdue;
  if(cards[2]){cards[2].querySelector("strong").textContent=`${score}%`;cards[2].querySelector(".metric-head b").textContent=`${score}%`;const bar=cards[2].querySelector(".progress-line i");if(bar)bar.style.width=`${score}%`;}
  const sums=document.querySelectorAll(".work-summary > div strong");
  if(sums[0])sums[0].textContent=String(active).padStart(2,"0");
  if(sums[1])sums[1].textContent=String(done).padStart(2,"0");
  if(sums[2])sums[2].textContent=String(waiting).padStart(2,"0");
  const ring=q(".work-ring");if(ring){ring.style.background=`conic-gradient(#2587ff 0 ${score}%, #ffffff0e ${score}% 100%)`;const s=ring.querySelector("strong");if(s)s.textContent=`${score}%`;}
  const list=q("#work .task-list");
  if(list){const rows=[...tasks].sort((a,b)=>(dateKey(a.dueDate)||"9999").localeCompare(dateKey(b.dueDate)||"9999")).slice(0,5);list.innerHTML=rows.length?rows.map(t=>`<div class="task-item"><i class="task-dot ${t.status==="DONE"?"blue-dot":t.status==="IN_PROGRESS"?"green-dot":t.priority==="URGENT"?"red-dot":"blue-dot"}"></i><div><strong>${esc(t.title||"Không tên")}</strong><span>${status[t.status]||"Chưa xác định"}</span></div><b>${progress(t)}%</b></div>`).join(""):`<div class="task-item"><i class="task-dot blue-dot"></i><div><strong>Chưa có công việc</strong><span>Không có Work được giao hoặc tự tạo</span></div><b>—</b></div>`;}
  const todayList=q(".today-list");
  if(todayList){const rows=tasks.filter(t=>dateKey(t.dueDate)===today).slice(0,5);todayList.innerHTML=rows.length?rows.map(t=>`<div><i class="check">${t.status==="DONE"?"✓":"•"}</i><span>${esc(t.title||"Không tên")}</span><time>${t.status==="DONE"?"Xong":"Hôm nay"}</time></div>`).join(""):`<div><i class="check">✓</i><span>Không có công việc đến hạn hôm nay</span><time>—</time></div>`;}
  const p=q(".report-card .report-copy p:not(.eyebrow)");if(p)p.textContent=`Đang theo dõi ${tasks.length} công việc từ Work. Tiến độ hiện tại ${score}%, ${done} đã hoàn thành và ${overdue} quá hạn.`;
  const ul=q(".report-card .report-copy ul");if(ul)ul.innerHTML=`<li>${active} công việc đang thực hiện.</li><li>${waiting} công việc chờ xử lý/review.</li><li>${overdue} công việc quá hạn.</li>`;
  const risk=q(".risk-note");if(risk)risk.innerHTML=`<span>!</span> ${overdue} công việc quá hạn trong phạm vi tài khoản.`;
}
