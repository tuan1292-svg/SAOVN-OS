import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getPermissions, can } from './permissions.js';

let redirected = false;
const guard = async user => {
  if (redirected) return;
  if (!user) {
    redirected = true;
    window.location.replace('index.html');
    return;
  }
  await getPermissions();
  if (!can('members', 'read')) {
    redirected = true;
    window.location.replace('dashboard.html');
  }
};

onAuthStateChanged(auth, guard);
