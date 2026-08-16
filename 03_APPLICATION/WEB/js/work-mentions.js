import { collection, addDoc, getDocs, doc, getDoc, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let activeTaskId = '';
let eligiblePeople = [];
let suggestionBox = null;
let boundInput = null;
let boundButton = null;

function taskRef(id){ return doc(db,'workTasks',id); }
function subRef(id){ return collection(db,'workTasks',id,'comments'); }
function normalize(v){ return String(v || '').trim().toLowerCase(); }

async function loadEligiblePeople(taskId){
  const taskSnap = await getDoc(taskRef(taskId));
  if(!taskSnap.exists()) return [];
  const task = taskSnap.data() || {};
  const ids = new Set(Array.isArray(task.assigneeIds) ? task.assigneeIds : []);
  if(task.assigneeId) ids.add(task.assigneeId);
  if(task.createdBy) ids.add(task.createdBy);
  ids.delete(auth.currentUser?.uid);
  const rows = [];
  for(const uid of ids){
    try{
      const snap = await getDoc(doc(db,'identities',uid));
      if(snap.exists()){
        const d = snap.data() || {};
        rows.push({uid,name:d.fullName || d.displayName || d.name || 'Thành viên',position:d.position || d.jobTitle || 'Nhân viên'});
      }
    }catch(error){ console.warn('Mention identity skipped:',uid,error?.code || error); }
  }
  return rows;
}

function currentMention(input){
  const value = input.value || '';
  const cursor = input.selectionStart ?? value.length;
  const before = value.slice(0,cursor);
  const match = before.match(/(?:^|\s)@([^\s@]*)$/);
  return match ? { query:match[1], start:cursor-match[1].length-1, end:cursor } : null;
}

function closeSuggestions(){ suggestionBox?.remove(); suggestionBox=null; }
function showSuggestions(input){
  const mention = currentMention(input);
  if(!mention){ closeSuggestions(); return; }
  const needle = normalize(mention.query);
  const allOption = { uid:'__ALL__', name:'Tất cả thành viên', position:`${eligiblePeople.length} người tham gia` };
  const rows = [allOption, ...eligiblePeople.filter(p=>!needle || normalize(p.name).includes(needle))].filter((row,index)=>{
    if(index===0) return !needle || normalize(row.name).includes(needle) || ['all','tat ca','tất cả','tất ca'].some(v=>v.includes(needle) || needle.includes(v));
    return true;
  }).slice(0,9);
  closeSuggestions();
  if(!rows.length) return;
  suggestionBox = document.createElement('div');
  suggestionBox.className='mention-suggestions';
  suggestionBox.innerHTML = rows.map(p=>`<button type="button" data-mention-uid="${esc(p.uid)}"><strong>@${esc(p.name)}</strong><small>${esc(p.position)}</small></button>`).join('');
  input.parentElement?.appendChild(suggestionBox);
  suggestionBox.querySelectorAll('[data-mention-uid]').forEach(button=>button.addEventListener('click',()=>{
    const uid=button.dataset.mentionUid;
    const person=uid==='__ALL__'?allOption:eligiblePeople.find(p=>p.uid===uid);
    if(!person)return;
    const m=currentMention(input); if(!m)return;
    const value=input.value;
    input.value=value.slice(0,m.start)+`@${person.name} `+value.slice(m.end);
    const pos=m.start+person.name.length+2;
    input.focus(); input.setSelectionRange(pos,pos); closeSuggestions();
  }));
}

function parseMentions(text){
  const allPattern=/(?:^|\s)@(tất cả thành viên|tat ca thanh vien|tất cả|tat ca|all)(?=\s|$|[,.!?;:])/i;
  if(allPattern.test(text)) return [...eligiblePeople];
  const found=[];
  eligiblePeople.forEach(person=>{
    const re = new RegExp(`@${escapeRegExp(person.name)}(?=\\s|$|[,.!?;:])`,'i');
    if(re.test(text)) found.push(person);
  });
  return found;
}
function escapeRegExp(v){return String(v).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

async function sendMentionComment(){
  if(!boundInput || !activeTaskId) return;
  const input=boundInput, button=boundButton;
  const text=input.value.trim(); if(!text) return;
  const u=auth.currentUser; if(!u)return;
  const mentions=parseMentions(text);
  input.disabled=true; if(button){button.disabled=true;button.textContent='Đang gửi...';}
  try{
    const identity=await getDoc(doc(db,'identities',u.uid));
    const d=identity.exists()?identity.data():{};
    const senderName=d.fullName||d.displayName||d.name||u.displayName||'Thành viên';
    const senderPosition=d.position||d.jobTitle||'Nhân viên';
    await addDoc(subRef(activeTaskId),{text,authorId:u.uid,authorName:senderName,authorPosition:senderPosition,mentionIds:mentions.map(p=>p.uid),mentionNames:mentions.map(p=>p.name),mentionAll:/@(?:tất cả thành viên|tat ca thanh vien|tất cả|tat ca|all)(?=\s|$|[,.!?;:])/i.test(text),createdAt:serverTimestamp()});
    input.value='';
    await notifyMentions(mentions,{senderName,senderPosition,taskTitle:await getTaskTitle(activeTaskId)});
    window.dispatchEvent(new CustomEvent('work-comment-created',{detail:{taskId:activeTaskId}}));
  }catch(error){
    console.error('Lỗi gửi comment Work:',error);
    alert(`Không thể gửi trao đổi: ${error?.code || 'Firestore error'}`);
  }finally{
    input.disabled=false; if(button){button.disabled=false;button.textContent='Gửi';} input.focus(); closeSuggestions();
  }
}

async function getTaskTitle(taskId){ try{const s=await getDoc(taskRef(taskId));return s.exists()?s.data().title||'Công việc':'Công việc';}catch{return 'Công việc';} }
async function notifyMentions(mentions,context){
  await Promise.allSettled(mentions.map(person=>addDoc(collection(db,'notifications',person.uid,'items'),{type:'WORK_MENTION',title:'Bạn đang được nhắc đến trong Work',body:`${context.senderName} đã nhắc đến bạn trong “${context.taskTitle}”.`,senderId:auth.currentUser?.uid||null,senderName:context.senderName,recipientId:person.uid,taskId:activeTaskId,targetUrl:`work.html?task=${encodeURIComponent(activeTaskId)}`,read:false,createdAt:serverTimestamp()})));
}

function bind(){
  const input=document.getElementById('commentInput');
  const button=document.getElementById('addComment');
  if(!input||!button||input===boundInput)return;
  const clean=button.cloneNode(true); button.replaceWith(clean);
  boundInput=input; boundButton=clean;
  input.addEventListener('input',()=>showSuggestions(input));
  input.addEventListener('keydown',e=>{if(e.key==='Escape')closeSuggestions();if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMentionComment();}});
  clean.addEventListener('click',sendMentionComment);
}

document.addEventListener('click',async e=>{
  const target=e.target.closest('[data-detail]');
  if(target){
    activeTaskId=target.dataset.detail;
    boundInput=null;boundButton=null;eligiblePeople=[];
    try{eligiblePeople=await loadEligiblePeople(activeTaskId)}catch(error){console.warn('Không tải được người có thể mention:',error?.code||error)}
    setTimeout(bind,120);
  }
  if(suggestionBox && !suggestionBox.contains(e.target) && e.target!==boundInput) closeSuggestions();
});
window.addEventListener('work-comment-created',()=>{ setTimeout(bind,80); });

const style=document.createElement('style');
style.textContent='.comment-add{position:relative}.mention-suggestions{position:absolute;left:0;right:54px;bottom:54px;z-index:50;padding:5px;border:1px solid #2587ff44;border-radius:10px;background:#07101ff2;box-shadow:0 18px 40px #0008;backdrop-filter:blur(16px)}.mention-suggestions button{display:flex;align-items:center;gap:8px;width:100%;padding:8px;border:0;border-radius:7px;background:transparent;color:#dce6f6;text-align:left;cursor:pointer}.mention-suggestions button:hover{background:#2587ff16}.mention-suggestions strong{font-size:9px}.mention-suggestions small{margin-left:auto;color:#718098;font-size:7px}';
document.head.appendChild(style);
