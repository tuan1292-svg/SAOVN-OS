/* SAOVN-OS Core — Communication Context
 * Shared read-model for Communication modules.
 * Uses existing Firebase Identity/Membership records; never creates users
 * and never grants security permissions.
 */

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from '../firebase-config.js';

function value(...values) {
  return values.find(item => item !== undefined && item !== null && String(item).trim() !== '') ?? null;
}

async function resolveCommunicationContext(user) {
  if (!user) return null;

  const identitySnap = await getDoc(doc(db, 'identities', user.uid));
  const identity = identitySnap.exists() ? identitySnap.data() : {};

  const membershipId = value(identity.membershipId, identity.activeMembershipId);
  let membership = {};

  if (membershipId) {
    const membershipSnap = await getDoc(doc(db, 'memberships', membershipId));
    if (membershipSnap.exists()) membership = membershipSnap.data();
  }

  const person = Object.freeze({
    uid: user.uid,
    name: value(identity.fullName, identity.displayName, identity.name, user.displayName, user.email?.split('@')[0], 'Thành viên'),
    position: value(identity.position, identity.title, identity.jobTitle, membership.position, 'Thành viên'),
    organizationId: value(membership.organizationId, membership.companyId, identity.organizationId, identity.companyId),
    departmentId: value(membership.departmentId, identity.departmentId),
    teamId: value(membership.teamId, identity.teamId),
    membershipId: membershipId || null,
    roleIds: Array.isArray(membership.roleIds) ? [...membership.roleIds] : Array.isArray(identity.roleIds) ? [...identity.roleIds] : []
  });

  return Object.freeze({
    identity,
    membership,
    person,
    user
  });
}

export async function bootstrapCommunicationContext() {
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      unsubscribe();
      if (!user) {
        resolve(null);
        return;
      }
      try {
        resolve(await resolveCommunicationContext(user));
      } catch (error) {
        console.warn('[SAOVN][COMMUNICATION] context fallback:', error?.code || error);
        resolve(Object.freeze({ user, identity: {}, membership: {}, person: Object.freeze({ uid: user.uid, name: user.displayName || 'Thành viên', position: 'Thành viên', roleIds: [] }) }));
      }
    });
  });
}

window.SAOVNCommunicationContext = Object.freeze({ bootstrapCommunicationContext });
