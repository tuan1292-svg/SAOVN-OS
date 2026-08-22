import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { buildRuntimeContext } from './core/policy-engine.js';
import { listModules } from './core/module-registry.js';
import { toPerson } from './core/people-context.js';

const MEMBERSHIP_ID = uid => `mem_${uid}_org_saovn_01`;
const RUNTIME_POLICY_ID = 'runtime';

export const PERMISSIONS = Object.freeze({
  DASHBOARD_VIEW: 'dashboard.view',
  WORK_VIEW: 'work.task.view', WORK_CREATE: 'work.task.create', WORK_EDIT: 'work.task.update', WORK_DELETE: 'work.task.delete', WORK_ASSIGN: 'work.task.assign', WORK_COMMENT: 'work.comment.create', WORK_CHECKLIST: 'work.checklist.update',
  DEPARTMENTS_VIEW: 'organization.department.view', DEPARTMENTS_MANAGE: 'organization.department.manage',
  MEMBERS_VIEW: 'people.member.view', MEMBERS_CREATE: 'people.member.create', MEMBERS_UPDATE: 'people.member.update', MEMBERS_ROLE_MANAGE: 'people.member.role.manage', MEMBERS_DELETE: 'people.member.delete',
  PROJECTS_VIEW: 'project.view', PROJECTS_CREATE: 'project.create', PROJECTS_EDIT: 'project.update', PROJECTS_DELETE: 'project.delete',
  ATTENDANCE_VIEW: 'attendance.view', ATTENDANCE_MANAGE: 'attendance.manage', CHAT_VIEW: 'chat.view', NOTIFICATIONS_VIEW: 'notifications.view',
  ROLES_MANAGE: 'admin.role.manage', SYSTEM_MANAGE: 'admin.system.manage'
});

const DEFAULT_POLICY = Object.freeze({
  version: 2,
  modules: { dashboard:{enabled:true}, work:{enabled:true}, departments:{enabled:true}, members:{enabled:true}, chat:{enabled:true}, notifications:{enabled:true}, projects:{enabled:true}, attendance:{enabled:true} },
  roles: {
    MEMBER:{capabilities:['dashboard.view','work.task.view','work.task.create','work.task.update','work.comment.create','work.checklist.update','organization.department.view','people.member.view','project.view','attendance.view','chat.view','notifications.view']},
    MANAGER:{capabilities:['dashboard.view','work.task.view','work.task.create','work.task.update','work.task.delete','work.task.assign','work.comment.create','work.checklist.update','organization.department.view','people.member.view','project.view','project.create','project.update','attendance.view','attendance.manage','chat.view','notifications.view']},
    ADMIN:{capabilities:[...Object.values(PERMISSIONS)]}
  }
});

let state={ready:false,uid:null,role:'MEMBER',permissions:new Set(),context:null};
let readyPromise; let policyUnsubscribe=null; let activeUser=null; let activeMembership={}; let activePolicy=DEFAULT_POLICY;
const clone=value=>Array.isArray(value)?value.slice():(value&&typeof value==='object'?{...value}:value);
function mergePolicy(base,override){const result={...base};Object.entries(override||{}).forEach(([key,value])=>{if(value&&typeof value==='object'&&!Array.isArray(value)&&base?.[key]&&typeof base[key]==='object'&&!Array.isArray(base[key]))result[key]=mergePolicy(base[key],value);else result[key]=clone(value);});return result;}
function normalizeRole(value){const role=String(value||'').trim().toUpperCase().replace(/[\s-]+/g,'_');if(!role)return'MEMBER';if(['SYSTEM_ADMIN','ADMINISTRATOR','ORG_ADMIN','OWNER','SUPER_ADMIN'].includes(role)||role==='ADMIN')return'ADMIN';if(['MANAGER','DIRECTOR','EXECUTIVE','TEAM_LEAD','DEPARTMENT_HEAD','CEO','CFO','CTO','COO','CHRO','CMO','VICE_PRESIDENT','VP'].includes(role))return'MANAGER';return'MEMBER';}
function rawRoleIds(data={}){const roles=data.roles||{};return [...new Set([...(Array.isArray(roles.system)?roles.system:[]),...(Array.isArray(roles.organization)?roles.organization:[]),...(Array.isArray(data.role)?data.role:[data.role].filter(Boolean)),data.systemRole,data.organizationRole].filter(Boolean).map(value=>String(value).trim().toUpperCase().replace(/[\s-]+/g,'_')))];}
function roleFromMembership(data={}){const normalized=rawRoleIds(data).map(normalizeRole);if(normalized.includes('ADMIN'))return'ADMIN';if(normalized.includes('MANAGER'))return'MANAGER';return'MEMBER';}
async function loadPolicy(){try{const snap=await getDoc(doc(db,'systemConfig',RUNTIME_POLICY_ID));return snap.exists()?mergePolicy(DEFAULT_POLICY,snap.data()):DEFAULT_POLICY;}catch(error){console.warn('Runtime policy unavailable; using safe local baseline.',error?.code||error);return DEFAULT_POLICY;}}
function effectiveMembership(membership,role){const rawRoles=rawRoleIds(membership);return {...membership,role,roleIds:[...new Set([...rawRoles,role])]};}
function buildExperienceRuntime(user,membership,policy){
  const effective=effectiveMembership(membership,state.role);
  const context=buildRuntimeContext({user,membership:effective,policy});
  const person=toPerson(user,effective);
  return Object.freeze({...context,person,rawRoleIds:rawRoleIds(effective),position:person.position,title:person.title});
}
function applyPolicy(policy){if(!activeUser)return state;activePolicy=mergePolicy(DEFAULT_POLICY,policy||{});const context=buildExperienceRuntime(activeUser,activeMembership,activePolicy);state={...state,permissions:context.capabilities,context,person:context.person};window.SAOVNRuntime=context;applyNavigation();window.dispatchEvent(new CustomEvent('saovn:permissions-ready',{detail:state}));window.dispatchEvent(new CustomEvent('saovn:runtime-ready',{detail:context}));return state;}
function watchPolicy(){if(policyUnsubscribe)policyUnsubscribe();if(!activeUser)return;policyUnsubscribe=onSnapshot(doc(db,'systemConfig',RUNTIME_POLICY_ID),snap=>applyPolicy(snap.exists()?snap.data():DEFAULT_POLICY),error=>console.warn('[SAOVN][RUNTIME] policy listener unavailable; retaining last known policy.',error?.code||error));}
export function hasPermission(permission){return state.permissions.has(permission);}
export function can(area,action='read'){const aliases={'members.read':PERMISSIONS.MEMBERS_VIEW,'members.manage':PERMISSIONS.MEMBERS_UPDATE,'members.create':PERMISSIONS.MEMBERS_CREATE,'members.update':PERMISSIONS.MEMBERS_UPDATE,'members.delete':PERMISSIONS.MEMBERS_DELETE,'members.role.manage':PERMISSIONS.MEMBERS_ROLE_MANAGE,'departments.read':PERMISSIONS.DEPARTMENTS_VIEW,'departments.manage':PERMISSIONS.DEPARTMENTS_MANAGE,'dashboard.read':PERMISSIONS.DASHBOARD_VIEW,'attendance.read':PERMISSIONS.ATTENDANCE_VIEW,'attendance.manage':PERMISSIONS.ATTENDANCE_MANAGE};const key=`${area}.${action}`;return hasPermission(key)||Boolean(aliases[key]&&hasPermission(aliases[key]));}
const ROUTE_MODULES=new Map([['dashboard.html','dashboard'],['work.html','work'],['departments.html','departments'],['chat.html','chat'],['notifications.html','notifications'],['members.html','members'],['projects.html','projects'],['attendance.html','attendance']]);
function currentRoute(){return String(location.pathname.split('/').pop()||'dashboard.html').toLowerCase();}
function ensureControlPlaneEntry(allowed){document.querySelectorAll('.sidebar-section').forEach(section=>{const title=section.querySelector('.sidebar-title')?.textContent?.toUpperCase()||'';if(!title.includes('QUẢN TRỊ')&&!title.includes('ADMIN'))return;let link=section.querySelector('a[data-control-plane-entry]');if(!link&&allowed){const container=section.querySelector('nav')||section;link=document.createElement('a');link.href='admin-control.html';link.className='navigation-item';link.dataset.controlPlaneEntry='true';link.innerHTML='<span class="nav-icon">⚙</span><span>Control Plane</span>';container.appendChild(link);}if(link)link.hidden=!allowed;});}
function routeAllowed(route,moduleId){if(!moduleId)return true;const module=listModules().find(item=>item.id===moduleId);if(!module)return true;if(state.context?.moduleEnabled?.(moduleId)===false)return false;return module.capabilities.some(capability=>hasPermission(capability));}
function applyNavigation(){const route=currentRoute();document.querySelectorAll('a[href]').forEach(node=>{const raw=String(node.getAttribute('href')||'').split('#')[0].split('?')[0];const target=raw.split('/').pop()?.toLowerCase();const moduleId=ROUTE_MODULES.get(target);if(!moduleId)return;const allowed=routeAllowed(target,moduleId);node.hidden=!allowed;node.setAttribute('aria-hidden',String(!allowed));});document.querySelectorAll('[data-capability]').forEach(node=>{const capability=node.dataset.capability;if(!capability)return;const allowed=hasPermission(capability);node.hidden=!allowed;node.setAttribute('aria-hidden',String(!allowed));});const controlPlaneAllowed=hasPermission(PERMISSIONS.SYSTEM_MANAGE);ensureControlPlaneEntry(controlPlaneAllowed);document.querySelectorAll('[data-admin-navigation="true"]').forEach(node=>{node.hidden=!controlPlaneAllowed;});document.querySelectorAll('.sidebar-section').forEach(section=>{const title=section.querySelector('.sidebar-title')?.textContent?.toUpperCase()||'';if(title.includes('QUẢN TRỊ')||title.includes('ADMIN'))section.hidden=!controlPlaneAllowed;});if(route==='admin-control.html'&&!controlPlaneAllowed){window.location.replace('dashboard.html');return;}if(route!=='dashboard.html'&&ROUTE_MODULES.has(route)&&!routeAllowed(route,ROUTE_MODULES.get(route)))window.location.replace('dashboard.html');}
async function load(user){if(!user)return state;activeUser=user;state.uid=user.uid;try{const snap=await getDoc(doc(db,'memberships',MEMBERSHIP_ID(user.uid)));activeMembership=snap.exists()?snap.data():{};}catch(error){activeMembership={};console.warn('Membership unavailable; using safe MEMBER baseline.',error?.code||error);}const role=roleFromMembership(activeMembership);const policy=await loadPolicy();activePolicy=policy;const effective=effectiveMembership(activeMembership,role);const context=Object.freeze({...buildRuntimeContext({user,membership:effective,policy}),person:toPerson(user,effective),rawRoleIds:rawRoleIds(effective),position:toPerson(user,effective).position,title:toPerson(user,effective).title});state={ready:true,uid:user.uid,role,permissions:context.capabilities,context,person:context.person};window.SAOVNRuntime=context;applyNavigation();watchPolicy();window.dispatchEvent(new CustomEvent('saovn:permissions-ready',{detail:state}));window.dispatchEvent(new CustomEvent('saovn:runtime-ready',{detail:context}));return state;}
readyPromise=new Promise(resolve=>onAuthStateChanged(auth,async user=>{if(policyUnsubscribe){policyUnsubscribe();policyUnsubscribe=null;}activeUser=user;activeMembership={};if(!user){state={ready:true,uid:null,role:'MEMBER',permissions:new Set(),context:null};applyNavigation();resolve(state);return;}resolve(await load(user));}));
export async function getPermissions(){await readyPromise;return state;} export const role=()=>state.role; export const permissionState=()=>state; export const runtimeContext=()=>state.context; export const runtimePolicy=()=>activePolicy; export const currentPerson=()=>state.person||state.context?.person||null; export const permissionsForRole=roleName=>[...(activePolicy.roles[normalizeRole(roleName)]?.capabilities||activePolicy.roles.MEMBER.capabilities)];
window.SAOVNPermissions={get:getPermissions,can,hasPermission,role,state:permissionState,runtime:runtimeContext,person:currentPerson,policy:runtimePolicy,permissionsForRole};
