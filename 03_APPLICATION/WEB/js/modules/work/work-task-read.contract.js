import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { db } from '../../firebase-config.js';

/**
 * WORK.TASK read contract.
 * Child plugins must use this contract instead of inventing their own
 * Firestore authorization queries.
 */
export async function getTasksReadableByUser({ userId, isAdmin = false, isManager = false, isDepartmentHead = false, isTeamLead = false, departmentId = '', department = '', teamId = '', team = '' }) {
  const tasks = new Map();
  const add = snapshot => snapshot.docs.forEach(doc => tasks.set(doc.id, { id: doc.id, ...doc.data() }));

  if (isAdmin) {
    add(await getDocs(collection(db, 'workTasks')));
    return [...tasks.values()];
  }

  // Management queries are allowed only when the caller's role matches the
  // same scope enforced by Firestore rules.
  if ((isManager || isDepartmentHead) && departmentId) {
    add(await getDocs(query(collection(db, 'workTasks'), where('departmentId', '==', departmentId))));
  } else if ((isManager || isDepartmentHead) && department) {
    add(await getDocs(query(collection(db, 'workTasks'), where('department', '==', department))));
  } else if (isTeamLead && teamId) {
    add(await getDocs(query(collection(db, 'workTasks'), where('teamId', '==', teamId))));
  } else if (isTeamLead && team) {
    add(await getDocs(query(collection(db, 'workTasks'), where('team', '==', team))));
  }

  // Every member can read tasks assigned to or created by themselves. These
  // queries are always valid for the corresponding Firestore rules.
  const [assigned, created] = await Promise.all([
    getDocs(query(collection(db, 'workTasks'), where('assigneeIds', 'array-contains', userId))),
    getDocs(query(collection(db, 'workTasks'), where('createdBy', '==', userId)))
  ]);
  add(assigned);
  add(created);

  return [...tasks.values()];
}
