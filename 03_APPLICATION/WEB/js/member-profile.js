import { onAuthStateChanged, getAuth } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const root=document.getElementById('profileRoot');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials=v=>String(v||'').trim().split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase().slice(0,2)||'TV';
const labels={FOUNDER_CHAIRMAN_CEO:'Founder · Chairman · CEO',INTERN:'Thực tập sinh',COLLABORATOR:'Cộng tác viên',STAFF:'Nhân viên',SPECIALIST:'Chuyên viên',SENIOR_SPECIALIST:'Chuyên viên cao cấp',TEAM_LEAD:'Trưởng nhóm',MANAGER:'Quản lý',DEPARTMENT_HEAD:'Trưởng phòng',DIRECTOR:'Giám đốc',OTHER:'Khác'};

onAuthStateChanged(auth,async user=>{
  if(!user){location.href='index.html';return;}
  const id=new URLSearchParams(location.search).get('id');
  if(!id){renderError('Thiếu thành viên cần xem.');return;}
  try{
    const snap=await getDoc(doc(db,'identities',id));
    if(!snap.exists()){renderError('Không tìm thấy hồ sơ thành viên.');return;}
    const d=snap.data()||{};
    let m={};try{const ms=await getDoc(doc(db,'memberships',`mem_${id}_org_saovn_01`));if(ms.exists())m=ms.data()||{};}catch(error){console.warn('Không tải được membership profile:',error?.code||error)}
    const name=d.fullName||d.displayName||d.name||d.email||'Thành viên';
    const position=labels[m.position||d.position||d.jobTitle]||m.position||d.position||d.jobTitle||'Nhân viên';
    const department=m.department||d.department||'Chưa phân phòng ban';
    const team=m.team||d.team||'Chưa phân Team';
    const role=m.roles?.system?Object.keys(m.roles.system).find(k=>m.roles.system[k])||'MEMBER':m.role||'MEMBER';
    const status=m.status||d.status||'ACTIVE';
    root.innerHTML=`<div class="profile-head"><div class="profile-avatar">${esc(initials(name))}</div><div><h1 class="profile-name">${esc(name)}</h1><p class="profile-title">${esc(position)}</p><span class="profile-status">${esc(status)}</span></div><div class="profile-actions">${id!==user.uid?`<a class="profile-btn" href="chat.html?user=${encodeURIComponent(id)}">💬 Nhắn tin</a>`:''}<a class="profile-btn secondary" href="work.html">▣ Công việc</a></div></div><div class="profile-grid"><div class="profile-box"><label>CHỨC DANH</label><strong>${esc(position)}</strong></div><div class="profile-box"><label>VAI TRÒ HỆ THỐNG</label><strong>${esc(role)}</strong></div><div class="profile-box"><label>PHÒNG BAN</label><strong>${esc(department)}</strong></div><div class="profile-box"><label>TEAM</label><strong>${esc(team)}</strong></div><div class="profile-box"><label>EMAIL</label><strong>${esc(d.email||'Chưa cập nhật')}</strong></div><div class="profile-box"><label>QUẢN LÝ TRỰC TIẾP</label><strong>${esc(m.managerName||d.managerName||'Chưa cập nhật')}</strong></div></div>`;
  }catch(error){console.error('Member profile error:',error);renderError(error?.code==='permission-denied'?'Bạn không có quyền xem hồ sơ này.':'Không thể tải hồ sơ.');}
});
function renderError(message){root.innerHTML=`<div class="profile-error"><strong>${esc(message)}</strong></div>`;}
