import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const $=id=>document.getElementById(id);
const normalizeCode=v=>String(v||'').trim().toUpperCase();
const roleValue=role=>role==='ADMIN'?'org_admin':role==='MANAGER'?'manager':'org_member';
let user=null;

function status(message,type=''){const el=$('activateStatus');if(el){el.textContent=message;el.className=`status ${type}`;}}

async function activate(e){
  e.preventDefault();
  if(!user){status('Bạn cần đăng nhập Firebase trước khi kích hoạt.','error');return;}
  const code=normalizeCode($('inviteCode')?.value);
  const button=$('activateBtn');
  if(!code){status('Vui lòng nhập mã mời.','error');return;}
  button.disabled=true;button.textContent='Đang xác thực...';status('Đang kiểm tra mã mời...','pending');
  try{
    const email=String(user.email||'').trim().toLowerCase();
    if(!email)throw new Error('Tài khoản Firebase này chưa có email.');
    const snap=await getDocs(query(collection(db,'invitations'),where('email','==',email),where('inviteCode','==',code),where('status','==','PENDING')));
    if(snap.empty)throw new Error('Không tìm thấy mã mời hợp lệ cho tài khoản email này.');
    if(snap.size>1)throw new Error('Có nhiều lời mời trùng mã. Vui lòng liên hệ quản trị viên.');
    const inviteSnap=snap.docs[0],invite=inviteSnap.data();
    const membershipRef=doc(db,'memberships',`mem_${user.uid}_org_saovn_01`);
    const roles={system:[],organization:[roleValue(String(invite.role||'MEMBER').toUpperCase())]};
    const batch=writeBatch(db);
    batch.set(membershipRef,{identityId:user.uid,userId:user.uid,organizationId:'org_saovn_01',status:'ACTIVE',roles,invitationId:inviteSnap.id,email,joinedAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:false});
    batch.update(inviteSnap.ref,{status:'ACCEPTED',acceptedBy:user.uid,acceptedAt:serverTimestamp()});
    const identityRef=doc(db,'identities',user.uid);
    batch.set(identityRef,{uid:user.uid,email,displayName:user.displayName||email.split('@')[0],status:'ACTIVE',updatedAt:serverTimestamp()},{merge:true});
    await batch.commit();
    status('Kích hoạt thành công. Đang chuyển vào SAOVN-OS...','success');
    setTimeout(()=>location.href='dashboard.html',700);
  }catch(err){console.error('Lỗi kích hoạt lời mời:',err);status(err?.message||'Không thể kích hoạt lời mời.','error');}
  finally{button.disabled=false;button.textContent='Kích hoạt thành viên';}
}

onAuthStateChanged(auth,current=>{user=current;if(!current){$('signedUser').textContent='Chưa đăng nhập — hãy đăng nhập trước.';return;}$('signedUser').textContent=`Đang đăng nhập: ${current.email||current.uid}`;});
$('activateForm')?.addEventListener('submit',activate);