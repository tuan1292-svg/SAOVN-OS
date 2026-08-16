import { collection, getDocs, query, where, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
const initials=v=>String(v||'TV').trim().split(/\s+/).filter(Boolean).slice(-2).map(x=>x[0]).join('').toUpperCase().slice(0,2)||'TV';
const peopleByUid=new Map(),peopleByName=new Map(),membershipToUid=new Map();
let modal=null,oldOverflow='';

function roles(d={}){const r=d.roles||{},out=[];for(const k of ['system','organization']){const v=r[k];if(Array.isArray(v))out.push(...v);else if(v&&typeof v==='object')out.push(...Object.keys(v).filter(x=>v[x]));}if(Array.isArray(d.role))out.push(...d.role);else if(d.role)out.push(d.role);return out.map(v=>String(v).toUpperCase());}
function isAdmin(d={}){return roles(d).some(v=>v==='ADMIN'||v==='SYSTEM_ADMIN'||v==='ORG_ADMIN'||v.includes('ADMIN'));}
function membershipUid(id,d={}){return d.identityId||d.userId||d.uid||String(id||'').match(/^mem_(.+)_org_/)?.[1]||null;}
function addAlias(v,p){const k=norm(v);if(k)peopleByName.set(k,p);}
function person(uid,i={},m={}){const name=i.fullName||i.displayName||i.name||m.fullName||m.displayName||m.name||i.email||m.email||uid;const raw=m.position||i.position||i.jobTitle||(isAdmin(m)?'FOUNDER_CHAIRMAN_CEO':'STAFF');const p={uid,name,position:raw,department:m.department||i.department||'Chưa phân phòng ban',team:m.team||i.team||'Chưa phân Team',email:i.email||m.email||'Chưa cập nhật',phone:i.phone||i.phoneNumber||i.mobile||i.mobileNumber||m.phone||m.phoneNumber||m.mobile||m.mobileNumber||'Chưa cập nhật',managerName:m.managerName||i.managerName||'Chưa cập nhật',role:isAdmin(m)?'ADMIN':(m.role||'MEMBER'),status:m.status||i.status||'ACTIVE'};peopleByUid.set(uid,p);[name,i.fullName,i.displayName,i.name,m.fullName,m.displayName,m.name,i.email,m.email].filter(Boolean).forEach(x=>addAlias(x,p));if(isAdmin(m)||String(raw).toUpperCase()==='FOUNDER_CHAIRMAN_CEO')addAlias('Admin',p);return p;}

async function loadPeople(){
  let ids=null;
  try{ids=await getDocs(query(collection(db,'identities'),where('status','==','ACTIVE')));}catch(e){try{ids=await getDocs(collection(db,'identities'));}catch(x){console.warn('Work member directory unavailable:',x?.code||x);}}
  let ms=null;
  try{ms=await getDocs(query(collection(db,'memberships'),where('status','==','ACTIVE')));}catch(e){try{ms=await getDocs(collection(db,'memberships'));}catch(x){ms=null;}}
  const map=new Map();
  ms?.forEach(s=>{const d=s.data()||{},uid=membershipUid(s.id,d);if(uid){map.set(uid,{id:s.id,...d});membershipToUid.set(s.id,uid);}});
  ids?.docs?.forEach(s=>person(s.id,s.data()||{},map.get(s.id)||{}));
  // Always seed the currently authenticated user. This keeps self/admin profile links
  // working even when directory queries are temporarily denied or still loading.
  if(auth.currentUser?.uid&&!peopleByUid.has(auth.currentUser.uid)){
    try{const s=await getDoc(doc(db,'identities',auth.currentUser.uid));if(s.exists())person(auth.currentUser.uid,s.data()||{},map.get(auth.currentUser.uid)||{});}catch(e){
      const u=auth.currentUser;person(u.uid,{fullName:u.displayName||u.email||'Bạn',email:u.email||''},map.get(u.uid)||{});
    }
  }
  window.dispatchEvent(new CustomEvent('saovn:work-directory-ready'));
}
function resolve(v){const raw=String(v||'').trim();if(!raw)return null;if(peopleByUid.has(raw))return raw;if(membershipToUid.has(raw))return membershipToUid.get(raw);const m=raw.match(/^mem_(.+)_org_/);if(m)return m[1];return peopleByName.get(norm(raw))?.uid||null;}
function link(p){return `<a class="work-member-link" href="#" data-member-profile="${esc(p.uid)}">${esc(p.name)}</a>`;}
function linkName(v){
  const raw=String(v||'').trim();
  if(!raw)return '';
  const clean=raw.replace(/\s+·\s+.*/, '').trim();
  const p=peopleByName.get(norm(clean));
  return p?link(p):esc(clean);
}
function enhance(){
  document.querySelectorAll('.assignee,.kanban-assignee').forEach(el=>{
    if(el.dataset.memberLinksReady==='1')return;
    const raw=el.textContent.trim();if(!raw||raw==='Chưa giao')return;
    const html=raw.split(',').map(x=>linkName(x.trim())).join(', ');
    el.innerHTML=html;el.dataset.memberLinksReady='1';
  });
  const body=document.getElementById('detailBody');
  if(body){
    const s=body.querySelector('.detail-summary>div:first-child strong');
    if(s&&!s.dataset.memberLinksReady){
      const raw=s.textContent.trim();
      if(raw&&raw!=='Chưa giao')s.innerHTML=raw.split(',').map(x=>linkName(x.trim())).join(', ');
      s.dataset.memberLinksReady='1';
    }
    body.querySelectorAll('.comment').forEach(c=>{
      if(c.dataset.memberLinksReady==='1')return;
      const n=c.querySelector('strong');
      const raw=n?.textContent?.trim();
      const uid=n?.dataset.memberProfile||resolve(raw);
      const p=uid?peopleByUid.get(uid):peopleByName.get(norm(raw));
      if(n&&p){n.outerHTML=link(p);c.dataset.memberLinksReady='1';}
    });
  }
}
function ensureModal(){if(modal)return modal;modal=document.createElement('div');modal.id='memberProfileModal';modal.className='member-profile-modal';modal.innerHTML='<div class="member-profile-backdrop" data-profile-close></div><section class="member-profile-dialog"><button class="member-profile-close" type="button" data-profile-close>×</button><div id="memberProfileContent">Đang tải hồ sơ…</div></section>';document.body.appendChild(modal);modal.addEventListener('click',e=>{if(e.target.closest('[data-profile-close]'))closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});injectStyles();return modal;}
async function openModal(raw){const m=ensureModal(),box=m.querySelector('#memberProfileContent'),uid=resolve(raw);m.classList.add('open');oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';box.innerHTML='<div class="member-profile-loading">Đang tải hồ sơ…</div>';let p=uid?peopleByUid.get(uid):null;if(!p&&uid){try{const s=await getDoc(doc(db,'identities',uid));if(s.exists())p=person(uid,s.data()||{},{});}catch(e){}if(!p){try{const s=await getDoc(doc(db,'memberships',`mem_${uid}_org_saovn_01`));if(s.exists())p=person(uid,{},s.data()||{});}catch(e){}}}if(!p)p=peopleByName.get(norm(raw))||null;if(!p){box.innerHTML='<div class="member-profile-error">Không tìm thấy hồ sơ thành viên.</div>';return;}box.innerHTML=`<div class="member-profile-hero"><div class="member-profile-avatar">${esc(initials(p.name))}</div><div><small>THÀNH VIÊN SAOVN</small><h2>${esc(p.name)}</h2><p>${esc(p.position)}</p></div></div><div class="member-profile-grid"><div><span>VAI TRÒ</span><strong>${esc(p.role==='ADMIN'?'Quản trị tổ chức':'Thành viên')}</strong></div><div><span>PHÒNG BAN</span><strong>${esc(p.department)}</strong></div><div><span>TEAM</span><strong>${esc(p.team)}</strong></div><div><span>EMAIL</span><strong>${esc(p.email)}</strong></div><div><span>SỐ ĐIỆN THOẠI</span><strong>${esc(p.phone)}</strong></div><div><span>QUẢN LÝ TRỰC TIẾP</span><strong>${esc(p.managerName)}</strong></div></div><div class="member-profile-actions"><a href="chat.html?user=${encodeURIComponent(p.uid)}">💬 Nhắn tin</a><a href="work.html">▣ Công việc</a></div>`;}
function closeModal(){if(!modal)return;modal.classList.remove('open');document.body.style.overflow=oldOverflow;}
document.addEventListener('click',e=>{const a=e.target.closest?.('[data-member-profile]');if(!a)return;e.preventDefault();e.stopPropagation();openModal(a.dataset.memberProfile);});
function injectStyles(){if(document.getElementById('memberProfileModalStyles'))return;const s=document.createElement('style');s.id='memberProfileModalStyles';s.textContent='.work-member-link{color:#dce9ff!important;text-decoration:none!important;font-weight:800;cursor:pointer;border-bottom:1px solid rgba(69,151,255,.28)}.work-member-link:hover{color:#61adff!important}.member-profile-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(2,6,17,.54);backdrop-filter:blur(14px)}.member-profile-modal.open{display:flex}.member-profile-dialog{position:relative;width:min(680px,94vw);max-height:88vh;overflow:auto;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:28px;background:rgba(7,16,31,.94);box-shadow:0 35px 110px rgba(0,0,0,.55)}.member-profile-close{position:absolute;right:16px;top:14px;width:36px;height:36px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.04);color:#aebbd0;font-size:24px;cursor:pointer}.member-profile-hero{display:flex;align-items:center;gap:18px}.member-profile-avatar{width:72px;height:72px;display:grid;place-items:center;border-radius:20px;background:#1b55a8;color:#fff;font-size:22px;font-weight:900}.member-profile-hero small{color:#7188a7;font-size:7px;letter-spacing:.16em}.member-profile-hero h2{margin:5px 0;color:#edf4ff;font-size:23px}.member-profile-hero p{margin:0;color:#94a7c2;font-size:10px}.member-profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:22px}.member-profile-grid>div{padding:13px;border:1px solid rgba(255,255,255,.08);border-radius:13px}.member-profile-grid span{display:block;margin-bottom:6px;color:#667791;font-size:7px}.member-profile-grid strong{color:#dce6f6;font-size:10px}.member-profile-actions{display:flex;gap:9px;margin-top:18px}.member-profile-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;border-radius:10px;text-decoration:none;font-size:9px;font-weight:800;background:#1673ef;color:#fff}.member-profile-actions a+ a{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}.member-profile-loading,.member-profile-error{padding:45px 20px;text-align:center;color:#91a2bb;font-size:10px}@media(max-width:560px){.member-profile-grid{grid-template-columns:1fr}}';document.head.appendChild(s);}
window.addEventListener('saovn:work-rendered',enhance);window.addEventListener('saovn:work-detail-rendered',enhance);window.addEventListener('saovn:work-directory-ready',enhance);
loadPeople().then(()=>{ensureModal();enhance();});