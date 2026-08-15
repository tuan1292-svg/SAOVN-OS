import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const BADGE_STYLE = `position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 4px;display:none;place-items:center;border-radius:10px;background:#ff3b3b;color:#fff;font:800 9px/1 Inter,"Segoe UI",sans-serif;border:2px solid #030712;box-shadow:0 0 12px #ff3b3b66;z-index:2`;
let stopNoti=null, stopChat=null;

onAuthStateChanged(auth, user => {
  stopNoti?.(); stopChat?.();
  if (!user) { setBadge('notification',0); setBadge('message',0); return; }
  const uid=user.uid;
  const notiRef=collection(db,'notifications',uid,'items');
  stopNoti=onSnapshot(notiRef, snap => {
    const count=snap.docs.reduce((n,d)=>n+(d.data()?.read===true?0:1),0);
    setBadge('notification',count);
  }, err => console.warn('Header notification badge:',err?.code||err));

  const chatRef=collection(db,'conversations');
  stopChat=onSnapshot(query(chatRef,where('memberIds','array-contains',uid)), snap => {
    const count=snap.docs.reduce((n,d)=>n+Number((d.data()?.unreadCount||{})[uid]||0),0);
    setBadge('message',count);
  }, err => console.warn('Header message badge:',err?.code||err));
});

function setBadge(type,count){
  const selector=type==='notification'?'.top-icon[href="notifications.html"]':'.top-icon[href="chat.html"]';
  document.querySelectorAll(selector).forEach(icon=>{
    if(getComputedStyle(icon).position==='static')icon.style.position='relative';
    let badge=icon.querySelector('.header-count-badge');
    if(!badge){badge=document.createElement('span');badge.className='header-count-badge';badge.style.cssText=BADGE_STYLE;icon.appendChild(badge);}
    badge.textContent=count>99?'99+':String(count);badge.style.display=count?'grid':'none';
  });
}
