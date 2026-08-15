import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, updateDoc, doc, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import { getWorkScope } from "./work-scope.js";

onAuthStateChanged(auth, async user => {
    if (!user) return;
    try {
        const scope = await getWorkScope();
        if (scope.type !== "ORGANIZATION") return;

        const snap = await getDocs(query(collection(db, "workTasks")));
        const jobs = [];
        snap.docs.forEach(d => {
            const data = d.data() || {};
            const existing = Array.isArray(data.assigneeIds) ? data.assigneeIds.filter(Boolean) : [];
            if (existing.length) return;
            const ids = [];
            if (Array.isArray(data.assignees)) data.assignees.forEach(a => a?.id && ids.push(a.id));
            if (!ids.length && data.assigneeId) ids.push(data.assigneeId);
            const unique = [...new Set(ids.map(String))];
            if (unique.length) jobs.push(updateDoc(doc(db, "workTasks", d.id), { assigneeIds: unique }));
        });
        if (jobs.length) {
            await Promise.all(jobs);
            console.info(`SAOVN Work: đã chuẩn hóa ${jobs.length} công việc sang assigneeIds.`);
        }
    } catch (error) {
        console.warn("Work assignee migration skipped:", error?.code || error);
    }
});
