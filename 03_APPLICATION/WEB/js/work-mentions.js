import { collection, addDoc, getDocs, doc, getDoc, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
let activeTaskId = '';
let eligiblePeople = [];
let suggestionBox = null;
let boundInput = null;
let boundButton = null;

function taskRef(id){ return doc(db,'workTasks',id); }
function subRef(id){ return collection(db,'workTasks',id,'comments'); }
function normalize(v){ return String(v || '').trim().toLowerCase(); }
function memberRef(uid){ return doc(db,'memberships',`mem_${uid}_org_saovn_01`); }

async function loadPerson(uid){
  if(!uid)return null;
  try{
    const snap=await getDoc(doc(db,'identities',uid));
    if(snap.exists()){
      const d=snap.data()||{};
      return {uid,name:d.fullName||d.displayName||d.name||d.email||'Thành viên',position:d.position||d.jobTitle||'Nhân viên'};
    }
  }catch(error){if(error?.code!=='permission-denied')console.warn('Mention identity skipped:',uid,error?.code||error);}
  try{
    const snap=await getDoc(memberRef(uid));
    if(snap.exists()){
      const d=snap.data()||{};
      return {uid,name:d.fullName||d.displayName||d.name||d.email||'Thành viên',position:d.position||d.jobTitle||'Nhân viên'};
    }
  }catch(error){if(error?.code!=='permission-denied')console.warn('Mention membership skipped:',uid,error?.code||error);}
  return null;
}

async function loadEligiblePeople(taskId){
  const taskSnap=await getDoc(taskRef(taskId));
  if(!taskSnap.exists())return [];
  const task=taskSnap.data()||{};
  const ids=new Set(Array.isArray(task.assigneeIds)?task.assigneeIds:[]);
  if(task.assigneeId)ids.add(task.assigneeId);
  if(task.createdBy)ids.add(task.createdBy);
  ids.delete(auth.currentUser?.uid);
  const rows=[];
  for(const uid of ids){const person=await loadPerson(uid);if(person)rows.push(person);}
  return rows;
}

function currentMention(input){
  const value=input.value||'',cursor=input.selectionStart??value.length,before=value.slice(0,cursor),match=before.match(/(?:^|\s)@([^\s@]*)$/);
  return match?{query:match[1],start:cursor-match[1].length-1,end:cursor}:null;
}
function closeSuggestions(){suggestionBox?.remove();suggestionBox=null;}
function showSuggestions(input){
  const mention=currentMention(input);
  if(!mention){closeSuggestions();return;}
  const needle=normalize(mention.query);
  const allOption={uid:'__ALL__',name:'Tất cả thành viên',position:`${eligiblePeople.length} người tham gia`};
  const rows=[allOption,...eligiblePeople.filter(p=>!needle||normalize(p.name).includes(needle))]
    .filter((row,index)=>index===0?(!needle||normalize(row.name).includes(needle)||['all','tat ca','tất cả','tất ca'].some(v=>v.includes(needle)||needle.includes(v))):true)
    .slice(0,9);
  closeSuggestions();
  if(!rows.length)return;
  suggestionBox=document.createElement('div');
  suggestionBox.className='mention-suggestions';
  suggestionBox.innerHTML=rows.map(p=>`<button type="button" data-mention-uid="${esc(p.uid)}"><strong>@${esc(p.name)}</strong><small>${esc(p.position)}</small></button>`).join('');
  input.parentElement?.appendChild(suggestionBox);
  suggestionBox.querySelectorAll('[data-mention-uid]').forEach(button=>button.addEventListener('click',()=>{
    const uid=button.dataset.mentionUid,person=uid==='__ALL__'?allOption:eligiblePeople.find(p=>p.uid===uid);if(!person)return;
    const m=currentMention(input);if(!m)return;
    const value=input.value;input.value=value.slice(0,m.start)+`@${person.name} `+value.slice(m.end);
    const pos=m.start+person.name.length+2;input.focus();input.setSelectionRange(pos,pos);closeSuggestions();
  }));
}
function parseMentions(text){
  const allPattern=/(?:^|\s)@(tất cả thành viên|tat ca thanh vien|tất cả|tat ca|all)(?=\s|$|[,.!?;:])/i;
  if(allPattern.test(text))return [...eligiblePeople];
  const found=[];
  eligiblePeople.forEach(person=>{
    const re=new RegExp(`@${escapeRegExp(person.name)}(?=\\s|$|[,.!?;:])`,'i');
    if(re.test(text))found.push(person);
  });
  return found;
}
function escapeRegExp(v){return String(v).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

async function sendMentionComment(){
  if(!boundInput||!activeTaskId)return;
  const input=boundInput,button=boundButton,text=input.value.trim();if(!text)return;
  const u=auth.currentUser;if(!u)return;
  const mentions=parseMentions(text);input.disabled=true;if(button){button.disabled=true;button.textContent='Đang gửi...';}
  try{
    const identity=await loadPerson(u.uid);
    const senderName=identity?.name||u.displayName||'Thành viên',senderPosition=identity?.position||'Nhân viên';
    await addDoc(subRef(activeTaskId),{text,authorId:u.uid,authorName:senderName,authorPosition:senderPosition,mentionIds:mentions.map(p=>p.uid),mentionNames:mentions.map(p=>p.name),mentionAll:/@(?:tất cả thành viên|tat ca thanh vien|tất cả|tat ca|all)(?=\s|$|[,.!?;:])/i.test(text),createdAt:serverTimestamp()});
    input.value='';
    await notifyMentions(mentions,{senderName,senderPosition,taskTitle:await getTaskTitle(activeTaskId)});
    window.dispatchEvent(new CustomEvent('work-comment-created',{detail:{taskId:activeTaskId}}));
  }catch(error){console.error('Lỗi gửi comment Work:',error);alert(`Không thể gửi trao đổi: ${error?.code||'Firestore error'}`);}
  finally{input.disabled=false;if(button){button.disabled=false;button.textContent='Gửi';}input.focus();closeSuggestions();}
}
async function getTaskTitle(taskId){try{const s=await getDoc(taskRef(taskId));return s.exists()?s.data().title||'Công việc':'Công việc';}catch{return 'Công việc';}}
async function notifyMentions(mentions,context){
  await Promise.allSettled(mentions.map(person=>addDoc(collection(db,'notifications',person.uid,'items'),{type:'WORK_MENTION',title:'Bạn đang được nhắc đến trong Work',body:`${context.senderName} đã nhắc đến bạn trong “${context.taskTitle}”.`,senderId:auth.currentUser?.uid||null,senderName:context.senderName,recipientId:person.uid,taskId:activeTaskId,targetUrl:`work.html?task=${encodeURIComponent(activeTaskId)}`,read:false,createdAt:serverTimestamp()})));
}

function bind(){
  const input=document.getElementById('commentInput'),button=document.getElementById('addComment');
  if(!input||!button)return false;
  if(input===boundInput&&button===boundButton)return true;
  boundInput=input;
  boundButton=button;
  input.addEventListener('input',()=>showSuggestions(input));
  input.addEventListener('keydown',e=>{if(e.key==='Escape')closeSuggestions();if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMentionComment();}});
  return true;
}

function prepareDetail(taskId){
  activeTaskId=taskId||'';
  if(!activeTaskId){eligiblePeople=[];return;}
  loadEligiblePeople(activeTaskId).then(rows=>{if(activeTaskId===taskId)eligiblePeople=rows;bind();}).catch(error=>{eligiblePeople=[];bind();if(error?.code!=='permission-denied')console.warn('Không tải được người được mention:',error?.code||error);});
}

document.addEventListener('click',e=>{
  const target=e.target.closest?.('[data-detail]');
  if(!target||e.target.closest('[data-edit]'))return;
  const taskId=target.dataset.detail;
  setTimeout(()=>prepareDetail(taskId),120);
});
window.addEventListener('work-detail-opened',e=>prepareDetail(e.detail?.taskId||''));
window.addEventListener('work-comment-created',e=>{const id=e.detail?.taskId||activeTaskId;if(id)prepareDetail(id);});
setTimeout(()=>bind(),500);
