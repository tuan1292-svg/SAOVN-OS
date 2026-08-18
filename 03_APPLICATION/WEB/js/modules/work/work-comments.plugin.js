import { collection, addDoc, getDocs, doc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "../../firebase-config.js";
import { registerModule, moduleHealth } from "../../core/module-registry.js";

registerModule({
  id: 'WORK.COMMENTS', parentId: 'WORK',
  dependencies: ['WORK.TASK', 'CORE.IDENTITY'],
  capabilities: ['WORK.COMMENTS.READ', 'WORK.COMMENTS.CREATE', 'WORK.COMMENTS.UPDATE', 'WORK.COMMENTS.DELETE'],
  owns: ['workTasks/{taskId}/comments']
});

const identityCache = new Map();
const POSITION_LABELS = {INTERN:'Thực tập sinh',COLLABORATOR:'Cộng tác viên',STAFF:'Nhân viên',SPECIALIST:'Chuyên viên',SENIOR_SPECIALIST:'Chuyên viên cao cấp',TEAM_LEAD:'Trưởng nhóm',MANAGER:'Quản lý',DEPARTMENT_HEAD:'Trưởng phòng',DIRECTOR:'Giám đốc',FOUNDER_CHAIRMAN_CEO:'Founder · Chairman · CEO',OTHER:'Khác'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const membershipRef=uid=>doc(db,'memberships',`mem_${uid}_org_saovn_01`);
const taskComments=taskId=>collection(db,'workTasks',taskId,'comments');
const positionLabel=p=>POSITION_LABELS[String(p||'STAFF').toUpperCase()]||String(p||'Nhân viên');
const identityDisplay=(identity={},fallback='Thành viên')=>({name:identity.fullName||identity.displayName||identity.name||identity.email||fallback,position:positionLabel(identity.position||identity.jobTitle||'STAFF')});
async function getIdentity(uid){
  if(!uid)return null;if(identityCache.has(uid))return identityCache.get(uid);
  try{const s=await getDoc(doc(db,'identities',uid));if(s.exists()){const v=s.data();identityCache.set(uid,v);return v;}}
  catch(e){if(e?.code!=='permission-denied')console.warn('Không tải được identity:',uid,e?.code||e)}
  try{const s=await getDoc(membershipRef(uid));if(s.exists()){const v=s.data();identityCache.set(uid,v);return v;}}
  catch(e){if(e?.code!=='permission-denied')console.warn('Không tải được membership hồ sơ:',uid,e?.code||e)}
  identityCache.set(uid,null);return null;
}
const timestamp=v=>{if(!v)return 0;if(typeof v.toMillis==='function')return v.toMillis();if(typeof v.toDate==='function')return v.toDate().getTime();const n=new Date(v).getTime();return Number.isNaN(n)?0:n};

export function createCommentsPanel(){return `<section class="collab-panel" data-work-plugin="WORK.COMMENTS"><div class="collab-head"><div><span class="eyebrow">TASK / COMMENTS</span><strong>Trao đổi</strong></div><span data-comment-count>0</span></div><div data-comment-list><span class="loading">Đang tải...</span></div><div class="comment-add"><textarea data-comment-input rows="2" maxlength="500" placeholder="Viết trao đổi về công việc..."></textarea><button data-add-comment type="button">Gửi</button></div></section>`}

export async function mountComments(taskId,root){
  if(!taskId||!root)return;root.dataset.workPluginState='loading';
  const button=root.querySelector('[data-add-comment]');
  button?.addEventListener('click',()=>{
    const detail={taskId,root,handled:false};
    window.dispatchEvent(new CustomEvent('work-comment-submit-request',{detail}));
    if(!detail.handled) void addComment(taskId,root);
  });
  await loadComments(taskId,root);
}

async function loadComments(taskId,root){
  const box=root.querySelector('[data-comment-list]'),count=root.querySelector('[data-comment-count]');
  try{
    const s=await getDocs(taskComments(taskId));count.textContent=s.size;
    const rows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>timestamp(a.createdAt)-timestamp(b.createdAt));
    if(!rows.length){box.innerHTML='<span class="loading">Chưa có trao đổi nào.</span>';root.dataset.workPluginState='ready';return}
    const comments=await Promise.all(rows.map(async x=>{const identity=await getIdentity(x.authorId),author=identityDisplay(identity,x.authorName||'Thành viên'),time=x.createdAt?.toDate?new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(x.createdAt.toDate()):'Vừa xong';return{...x,author,time}}));
    box.innerHTML=comments.map(x=>`<article class="comment"><div class="comment-avatar">${esc(x.author.name.slice(0,1).toUpperCase())}</div><div><strong data-member-profile="${esc(x.authorId||'')}">${esc(x.author.name)}</strong><span class="comment-position">${esc(x.author.position)}</span><small>${esc(x.time)}</small><p>${esc(x.text)}</p></div></article>`).join('');root.dataset.workPluginState='ready';
  }catch(e){console.warn('Không tải được trao đổi:',e?.code||e);box.innerHTML='<span class="loading">Chưa có trao đổi hoặc tài khoản chưa được cấp quyền cộng tác.</span>';root.dataset.workPluginState='error';moduleHealth('WORK.COMMENTS','degraded',e?.code||String(e))}
}

export async function addComment(taskId,root,textOverride='',mentionData={}){
  const input=root.querySelector('[data-comment-input]');if(!auth.currentUser)return false;
  const text=(textOverride||input?.value||'').trim();if(!text)return false;
  const button=root.querySelector('[data-add-comment]');if(input)input.disabled=true;if(button)button.disabled=true;
  try{
    const identity=await getIdentity(auth.currentUser.uid),author=identityDisplay(identity,auth.currentUser.displayName||'Thành viên');
    await addDoc(taskComments(taskId),{text,authorId:auth.currentUser.uid,authorName:author.name,authorPosition:author.position,mentionIds:Array.isArray(mentionData.mentionIds)?mentionData.mentionIds:[],mentionNames:Array.isArray(mentionData.mentionNames)?mentionData.mentionNames:[],mentionAll:mentionData.mentionAll===true,createdAt:serverTimestamp()});
    if(input)input.value='';await loadComments(taskId,root);window.dispatchEvent(new CustomEvent('work-comment-created',{detail:{taskId,mentionIds:mentionData.mentionIds||[]}}));return true;
  }catch(e){console.warn('Không thể gửi trao đổi:',e?.code||e);alert('Không thể gửi trao đổi. Tài khoản chưa có quyền cộng tác với công việc này.');return false}
  finally{if(input)input.disabled=false;if(button)button.disabled=false;if(input)input.focus()}
}

moduleHealth('WORK.COMMENTS','ready');
