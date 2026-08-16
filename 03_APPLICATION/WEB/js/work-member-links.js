import { collection, getDocs, query, where, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
const initials=v=>String(v||'TV').trim().split(/\s+/).filter(Boolean).slice(-2).map(x=>x[0]).join('').toUpperCase().slice(0,2)||'TV';
const byUid=new Map(),byName=new Map(),membershipToUid=new Map();
let modal=null,oldOverflow='';

function roles(d={}){const r=d.roles||{},out=[];for(const k of ['system','organization']){const v=r[k];if(Array.isArray(v))out.push(...v);else if(v&&typeof v==='object')out.push(...Object.keys(v).filter(x=>v[x]));}if(Array.isArray(d.role))out.push(...d.role);else if(d.role)out.push(d.role);return out.map(x=>String(x).toUpperCase());}
function admin(d={}){return roles(d).some(x=>x.includes('ADMIN'));}
function uidOf(id,d={}){return d.identityId||d.userId||d.uid||String(id||'').match(/^mem_(.+)_org_/)?.[1]||null;}
function alias(v,p){const k=norm(v);if(k)byName.set(k,p);}
function make(uid,i={},m={}){const name=i.fullName||i.displayName||i.name||m.fullName||m.displayName||m.name||i.email||m.email||uid;const p={uid,name,position:m.position||i.position||i.jobTitle||'',department:m.department||i.department||'Chưa phân phòng ban',team:m.team||i.team||'Chưa phân Team',email:i.email||m.email||'Chưa cập nhật',phone:i.phone||i.phoneNumber||i.mobile||i.mobileNumber||m.phone||m.phoneNumber||m.mobile||m.mobileNumber||'Chưa cập nhật',managerName:m.managerName||i.managerName||'Chưa cập nhật',role:admin(m)?'ADMIN':(m.role||'MEMBER')};byUid.set(uid,p);[name,i.fullName,i.displayName,i.name,m.fullName,m.displayName,m.name,i.email,m.email].filter(Boolean).forEach(x=>alias(x,p));if(admin(m))alias('Admin',p);return p;}

async function loadDirectory(){
  let ids=null,ms=null;
  try{ids=await getDocs(query(collection(db,'identities'),where('status','==','ACTIVE')));}catch(e){try{ids=await getDocs(collection(db,'identities'));}catch(x){}}
  try{ms=await getDocs(query(collection(db,'memberships'),where('status','==','ACTIVE')));}catch(e){try{ms=await getDocs(collection(db,'memberships'));}catch(x){}}
  const mm=new Map();ms?.forEach(s=>{const d=s.data()||{},u=uidOf(s.id,d);if(u){mm.set(u,{id:s.id,...d});membershipToUid.set(s.id,u);}});
  ids?.docs?.forEach(s=>make(s.id,s.data()||{},mm.get(s.id)||{}));
  const u=auth.currentUser;
  if(u&&!byUid.has(u.uid)){
    try{const s=await getDoc(doc(db,'identities',u.uid));if(s.exists())make(u.uid,s.data()||{},mm.get(u.uid)||{});}catch(e){make(u.uid,{fullName:u.displayName||u.email||'Bạn',email:u.email||''},mm.get(u.uid)||{});}
  }
  ensureModal();
  window.dispatchEvent(new CustomEvent('saovn:work-directory-ready'));
  enhance();
}
function resolve(v){const raw=String(v||'').trim();if(!raw)return null;if(byUid.has(raw))return raw;if(membershipToUid.has(raw))return membershipToUid.get(raw);const m=raw.match(/^mem_(.+)_org_/);if(m)return m[1];return byName.get(norm(raw))?.uid||null;}
function cleanName(v){return String(v||'').replace(/\s+·\s+.*/, '').trim();}
function link(p){return `<a href="#" class="work-member-link" data-member-profile="${esc(p.uid)}">${esc(p.name)}</a>`;}
function linkName(v){const clean=cleanName(v);const p=byName.get(norm(clean));return p?link(p):esc(clean);}
function enhance(){
  document.querySelectorAll('.assignee,.kanban-assignee').forEach(el=>{
    if(el.dataset.memberLinksReady==='1')return;
    const raw=el.textContent.trim();if(!raw||raw==='Chưa giao')return;
    el.innerHTML=raw.split(',').map(linkName).join(', ');el.dataset.memberLinksReady='1';
  });
  const body=document.getElementById('detailBody');
  if(!body)return;
  const assignee=body.querySelector('.detail-summary>div:first-child strong');
  if(assignee&&!assignee.dataset.memberLinksReady){const raw=assignee.textContent.trim();if(raw&&raw!=='Chưa giao')assignee.innerHTML=raw.split(',').map(linkName).join(', ');assignee.dataset.memberLinksReady='1';}
  body.querySelectorAll('.comment').forEach(c=>{
    const n=c.querySelector('strong');if(!n||n.closest('[data-member-profile]'))return;
    const raw=cleanName(n.textContent),p=byName.get(norm(raw));if(p){n.outerHTML=link(p);c.dataset.memberLinksReady='1';}
  });
}
function scheduleEnhance(){[80,250,600,1200].forEach(ms=>setTimeout(enhance,ms));}
function ensureModal(){if(modal)return modal;modal=document.createElement('div');modal.id='memberProfileModal';modal.className='member-profile-modal';modal.innerHTML='<div class="member-profile-backdrop" data-profile-close></div><section class="member-profile-dialog"><button class="member-profile-close" type="button" data-profile-close>×</button><div id="memberProfileContent">Đang tải hồ sơ…</div></section>';document.body.appendChild(modal);modal.addEventListener('click',e=>{if(e.target.closest('[data-profile-close]'))closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});injectStyles();return modal;}
async function openModal(raw){const m=ensureModal(),box=m.querySelector('#memberProfileContent'),uid=resolve(raw);m.classList.add('open');oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';box.innerHTML='<div class="member-profile-loading">Đang tải hồ sơ…</div>';let p=uid?byUid.get(uid):null;if(!p&&uid){try{const s=await getDoc(doc(db,'identities',uid));if(s.exists())p=make(uid,s.data()||{});}catch(e){}if(!p){try{const s=await getDoc(doc(db,'memberships',`mem_${uid}_org_saovn_01`));if(s.exists())p=make(uid,{},s.data()||{});}catch(e){}}}if(!p)p=byName.get(norm(raw))||null;if(!p){box.innerHTML='<div class="member-profile-error">Không tìm thấy hồ sơ thành viên.</div>';return;}box.innerHTML=`<div class="member-profile-hero"><div class="member-profile-avatar">${esc(initials(p.name))}</div><div><small>THÀNH VIÊN SAOVN</small><h2>${esc(p.name)}</h2><p>${esc(p.position)}</p></div></div><div class="member-profile-grid"><div><span>VAI TRÒ</span><strong>${esc(p.role==='ADMIN'?'Quản trị tổ chức':'Thành viên')}</strong></div><div><span>PHÒNG BAN</span><strong>${esc(p.department)}</strong></div><div><span>TEAM</span><strong>${esc(p.team)}</strong></div><div><span>EMAIL</span><strong>${esc(p.email)}</strong></div><div><span>SỐ ĐIỆN THOẠI</span><strong>${esc(p.phone)}</strong></div><div><span>QUẢN LÝ TRỰC TIẾP</span><strong>${esc(p.managerName)}</strong></div></div><div class="member-profile-actions"><a href="chat.html?user=${encodeURIComponent(p.uid)}">💬 Nhắn tin</a><a href="work.html">▣ Công việc</a></div>`;}
function closeModal(){if(!modal)return;modal.classList.remove('open');document.body.style.overflow=oldOverflow;}
document.addEventListener('click',e=>{const a=e.target.closest?.('[data-member-profile]');if(a){e.preventDefault();e.stopPropagation();openModal(a.dataset.memberProfile);return;}const detail=e.target.closest?.('[data-detail]');if(detail)scheduleEnhance();});
window.addEventListener('saovn:work-rendered',scheduleEnhance);
window.addEventListener('saovn:work-detail-rendered',scheduleEnhance);
window.addEventListener('saovn:work-directory-ready',scheduleEnhance);
function injectStyles(){if(document.getElementById('memberProfileModalStyles'))return;const s=document.createElement('style');s.id='memberProfileModalStyles';s.textContent='.work-member-link{color:#dce9ff!important;text-decoration:none!important;font-weight:800;cursor:pointer;border-bottom:1px solid rgba(69,151,255,.35)}.work-member-link:hover{color:#61adff!important;border-bottom-color:#61adff}.member-profile-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(2,6,17,.54);backdrop-filter:blur(14px)}.member-profile-modal.open{display:flex}.member-profile-dialog{position:relative;width:min(680px,94vw);max-height:88vh;overflow:auto;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:28px;background:rgba(7,16,31,.94);box-shadow:0 35px 110px rgba(0,0,0,.55)}.member-profile-close{position:absolute;right:16px;top:14px;width:36px;height:36px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.04);color:#aebbd0;font-size:24px;cursor:pointer}.member-profile-hero{display:flex;align-items:center;gap:18px}.member-profile-avatar{width:72px;height:72px;display:grid;place-items:center;border-radius:20px;background:#1b55a8;color:#fff;font-size:22px;font-weight:900}.member-profile-hero small{color:#7188a7;font-size:7px;letter-spacing:.16em}.member-profile-hero h2{margin:5px 0;color:#edf4ff;font-size:23px}.member-profile-hero p{margin:0;color:#94a7c2;font-size:10px}.member-profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:22px}.member-profile-grid>div{padding:13px;border:1px solid rgba(255,255,255,.08);border-radius:13px}.member-profile-grid span{display:block;margin-bottom:6px;color:#667791;font-size:7px}.member-profile-grid strong{color:#dce6f6;font-size:10px}.member-profile-actions{display:flex;gap:9px;margin-top:18px}.member-profile-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;border-radius:10px;text-decoration:none;font-size:9px;font-weight:800;background:#1673ef;color:#fff}.member-profile-actions a+a{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}.member-profile-loading,.member-profile-error{padding:45px 20px;text-align:center;color:#91a2bb;font-size:10px}@media(max-width:560px){.member-profile-grid{grid-template-columns:1fr}}';document.head.appendChild(s);}
loadDirectory();