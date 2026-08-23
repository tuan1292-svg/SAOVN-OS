import { signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const loginForm=document.getElementById('loginForm'),identityInput=document.getElementById('identity'),passwordInput=document.getElementById('password'),identityError=document.getElementById('identityError'),passwordError=document.getElementById('passwordError'),formStatus=document.getElementById('formStatus'),loginButton=document.getElementById('loginButton'),passwordToggle=document.getElementById('passwordToggle');
let redirecting=false;

function getLocalDateKey(date=new Date()){
    const year=date.getFullYear();
    const month=String(date.getMonth()+1).padStart(2,'0');
    const day=String(date.getDate()).padStart(2,'0');
    return `${year}-${month}-${day}`;
}

async function recordAttendanceAccess(user){
    const date=getLocalDateKey();
    const attendanceId=`${user.uid}_${date}`;
    const attendanceRef=doc(db,'attendanceDays',attendanceId);
    await setDoc(attendanceRef,{userId:user.uid,organizationId:'org_saovn_01',date,hasAccess:true,status:'ACTIVE',lastAccessAt:serverTimestamp()},{merge:true});
}

async function routeAfterLogin(user){
    if(!user||redirecting)return;
    redirecting=true;
    try{
        const [identitySnap,membershipSnap]=await Promise.all([
            getDoc(doc(db,'identities',user.uid)),
            getDoc(doc(db,'memberships',`mem_${user.uid}_org_saovn_01`))
        ]);
        const identity=identitySnap.exists()?identitySnap.data():{};
        const membership=membershipSnap.exists()?membershipSnap.data():{};
        const status=String(membership.status||identity.status||'ACTIVE').toUpperCase();
        if(status==='PENDING'||identity.mustChangePassword===true){window.location.replace('activate.html');return;}
        try{await recordAttendanceAccess(user);}catch(attendanceError){console.warn('Không thể ghi nhận điểm danh hệ thống:',attendanceError);}
        window.location.replace('dashboard.html');
    }catch(error){
        console.error('Không thể kiểm tra trạng thái tài khoản:',error);
        window.location.replace('dashboard.html');
    }
}

onAuthStateChanged(auth,user=>{if(user)routeAfterLogin(user);});
function clearErrors(){identityError.textContent='';passwordError.textContent='';document.querySelectorAll('.form-group').forEach(group=>group.classList.remove('has-error'));formStatus.textContent='';formStatus.className='form-status';}
function showFormError(message){formStatus.textContent=message;formStatus.className='form-status visible error';}
function setLoading(isLoading){loginButton.disabled=isLoading;if(isLoading)loginButton.classList.add('loading');else loginButton.classList.remove('loading');}
if(passwordToggle&&passwordInput){passwordToggle.addEventListener('click',()=>{const isPassword=passwordInput.type==='password';passwordInput.type=isPassword?'text':'password';passwordToggle.setAttribute('aria-label',isPassword?'Ẩn mật khẩu':'Hiện mật khẩu');});}
if(loginForm){loginForm.addEventListener('submit',async event=>{event.preventDefault();clearErrors();const email=identityInput.value.trim(),password=passwordInput.value;if(!email||!password){showFormError('Vui lòng nhập đầy đủ Email và Mật khẩu.');return;}setLoading(true);try{await signInWithEmailAndPassword(auth,email,password);}catch(error){redirecting=false;setLoading(false);switch(error.code){case'auth/invalid-email':showFormError('Định dạng email không hợp lệ.');break;case'auth/user-disabled':showFormError('Tài khoản này đã bị vô hiệu hóa.');break;case'auth/user-not-found':case'auth/wrong-password':case'auth/invalid-credential':showFormError('Email hoặc mật khẩu không chính xác.');break;case'auth/too-many-requests':showFormError('Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.');break;default:showFormError('Đã xảy ra lỗi: '+error.message);}}});identityInput.addEventListener('input',clearErrors);passwordInput.addEventListener('input',clearErrors);}
