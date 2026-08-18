import { collection, getDoc, doc, serverTimestamp, addDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from '../../firebase-config.js';
import { registerModule, moduleHealth } from '../../core/module-registry.js';
import { addComment } from './work-comments.plugin.js';

registerModule({
  id: 'WORK.MENTIONS',
  parentId: 'WORK',
  dependencies: ['WORK.TASK', 'WORK.COMMENTS', 'CORE.IDENTITY', 'CORE.NOTIFICATION'],
  capabilities: ['WORK.MENTIONS.RESOLVE', 'WORK.MENTIONS.CREATE'],
  owns: ['mentionIds/mentionNames on WORK.COMMENTS records'],
  legacyEntry: 'work-mentions.js'
});

const memberRef = uid => doc(db, 'memberships', `mem_${uid}_org_saovn_01`);
const taskRef = id => doc(db, 'workTasks', id);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = value => String(value || '').trim().toLowerCase();
let activeTaskId = '';
let activeRoot = null;
let eligiblePeople = [];
let input = null;
let button = null;
let suggestionBox = null;

async function loadPerson(uid) {
  try { const snap=await getDoc(doc(db,'identities',uid)); if(snap.exists()){const d=snap.data()||{};return {uid,name:d.fullName||d.displayName||d.name||d.email||'Thành viên',position:d.position||d.jobTitle||'Nhân viên'};} }
  catch(error){ if(error?.code!=='permission-denied') console.warn('[WORK.MENTIONS] identity skipped',error); }
  try { const snap=await getDoc(memberRef(uid)); if(snap.exists()){const d=snap.data()||{};return {uid,name:d.fullName||d.displayName||d.name||d.email||'Thành viên',position:d.position||d.jobTitle||'Nhân viên'};} }
  catch(error){ if(error?.code!=='permission-denied') console.warn('[WORK.MENTIONS] membership skipped',error); }
  return null;
}

export async function resolveEligiblePeople(taskId) {
  const snap=await getDoc(taskRef(taskId));if(!snap.exists())return [];
  const task=snap.data()||{},ids=new Set(Array.isArray(task.assigneeIds)?task.assigneeIds:[]);
  if(task.assigneeId)ids.add(task.assigneeId);if(task.createdBy)ids.add(task.createdBy);ids.delete(auth.currentUser?.uid);
  const result=[];for(const uid of ids){const person=await loadPerson(uid);if(person)result.push(person);}return result;
}

function escapeRegExp(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
export function parseMentions(text,people=eligiblePeople){
  const allPattern=/(?:^|\s)@(tất cả thành viên|tat ca thanh vien|tất cả|tat ca|all)(?=\s|$|[,.!?;:])/i;
  if(allPattern.test(text))return [...people];
  return people.filter(person=>new RegExp(`@${escapeRegExp(person.name)}(?=\\s|$|[,.!?;:])`,'i').test(text));
}

export async function notifyMentions(mentions,{senderName,taskId,taskTitle}){
  await Promise.allSettled((mentions||[]).map(person=>addDoc(collection(db,'notifications',person.uid,'items'),{type:'WORK_MENTION',title:'Bạn đang được nhắc đến trong Work',body:`${senderName} đã nhắc đến bạn trong “${taskTitle||'Công việc'}”.`,senderId:auth.currentUser?.uid||null,recipientId:person.uid,taskId,targetUrl:`work.html?task=${encodeURIComponent(taskId)}`,read:false,createdAt:serverTimestamp()})));
}

function currentMention(){if(!input)return null;const value=input.value||'',cursor=input.selectionStart??value.length,before=value.slice(0,cursor),match=before.match(/(?:^|\s)@([^\s@]*)$/);return match?{query:match[1],start:cursor-match[1].length-1,end:cursor}:null;}
function closeSuggestions(){suggestionBox?.remove();suggestionBox=null;}
function showSuggestions(){const m=currentMention();if(!m){closeSuggestions();return;}const needle=normalize(m.query),all={uid:'__ALL__',name:'Tất cả thành viên',position:`${eligiblePeople.length} người tham gia`};const rows=[all,...eligiblePeople.filter(p=>!needle||normalize(p.name).includes(needle))].filter((p,i)=>i!==0||!needle||normalize(p.name).includes(needle)||['all','tat ca','tất cả','tất ca'].some(v=>v.includes(needle)||needle.includes(v))).slice(0,9);closeSuggestions();if(!rows.length)return;suggestionBox=document.createElement('div');suggestionBox.className='mention-suggestions';suggestionBox.innerHTML=rows.map(p=>`<button type="button" data-mention-uid="${esc(p.uid)}"><strong>@${esc(p.name)}</strong><small>${esc(p.position)}</small></button>`).join('');input.parentElement?.appendChild(suggestionBox);suggestionBox.querySelectorAll('[data-mention-uid]').forEach(b=>b.addEventListener('click',()=>{const person=b.dataset.mentionUid==='__ALL__'?all:eligiblePeople.find(p=>p.uid===b.dataset.mentionUid);if(!person)return;const mm=currentMention();if(!mm)return;input.value=input.value.slice(0,mm.start)+`@${person.name} `+input.value.slice(mm.end);const pos=mm.start+person.name.length+2;input.focus();input.setSelectionRange(pos,pos);closeSuggestions();}));}

async function submit(taskId,root){if(!input||!auth.currentUser)return;const text=input.value.trim();if(!text)return;const mentions=parseMentions(text);if(button){button.disabled=true;button.textContent='Đang gửi...';}try{const sender=await loadPerson(auth.currentUser.uid);const ok=await addComment(taskId,root,text,{mentionIds:mentions.map(p=>p.uid),mentionNames:mentions.map(p=>p.name),mentionAll:mentions.length===eligiblePeople.length&&/@(?:tất cả thành viên|tat ca thanh vien|tất cả|tat ca|all)(?=\s|$|[,.!?;:])/i.test(text)});if(ok){await notifyMentions(mentions,{senderName:sender?.name||auth.currentUser.displayName||'Thành viên',taskId,taskTitle:(await getDoc(taskRef(taskId))).data()?.title});}}catch(error){console.error('[WORK.MENTIONS] submit failed',error);alert(`Không thể gửi trao đổi: ${error?.code||'Firestore error'}`)}finally{if(button){button.disabled=false;button.textContent='Gửi';}closeSuggestions();}}

function bind(){if(!activeRoot)return;input=activeRoot.querySelector('[data-comment-input]');button=activeRoot.querySelector('[data-add-comment]');if(!input||!button)return;input.addEventListener('input',showSuggestions);input.addEventListener('keydown',e=>{if(e.key==='Escape')closeSuggestions();if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(activeTaskId,activeRoot);}});window.addEventListener('work-comment-submit-request',e=>{if(e.detail?.root!==activeRoot)return;e.preventDefault();submit(e.detail.taskId,e.detail.root);});}

window.addEventListener('work-detail-opened',async e=>{activeTaskId=e.detail?.taskId||'';activeRoot=document.querySelector('[data-work-plugin="WORK.COMMENTS"]');eligiblePeople=activeTaskId?await resolveEligiblePeople(activeTaskId):[];input=null;button=null;bind();});
moduleHealth('WORK.MENTIONS','ready');
