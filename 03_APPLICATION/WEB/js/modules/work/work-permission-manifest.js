/**
 * Canonical Work permission/data boundary map.
 * Firestore rules remain authoritative; this manifest prevents the frontend
 * module graph from silently claiming another module's data namespace.
 */

export const WORK_PERMISSION_MANIFEST = Object.freeze({
  'WORK.TASK': Object.freeze({
    namespace: 'WORK.TASK.*',
    paths: Object.freeze(['workTasks/{taskId}'])
  }),
  'WORK.CHECKLIST': Object.freeze({
    namespace: 'WORK.CHECKLIST.*',
    paths: Object.freeze(['workTasks/{taskId}/checklist/{itemId}'])
  }),
  'WORK.COMMENTS': Object.freeze({
    namespace: 'WORK.COMMENTS.*',
    paths: Object.freeze(['workTasks/{taskId}/comments/{commentId}'])
  }),
  'WORK.MENTIONS': Object.freeze({
    namespace: 'WORK.MENTIONS.*',
    paths: Object.freeze(['notifications/{userId}/items/{notificationId}'])
  }),
  'WORK.ANALYTICS': Object.freeze({
    namespace: 'WORK.ANALYTICS.*',
    paths: Object.freeze(['workTasks/{taskId}', 'workTasks/{taskId}/activity/{activityId}'])
  }),
  'WORK.CHAT': Object.freeze({
    namespace: 'WORK.CHAT.*',
    paths: Object.freeze(['workTasks/{taskId}/chat/{messageId}'])
  })
});

export function getWorkPermissionDefinition(moduleId) {
  return WORK_PERMISSION_MANIFEST[moduleId] || null;
}
