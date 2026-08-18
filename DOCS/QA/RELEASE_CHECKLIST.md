# SAOVN-OS Release Checklist

## Before coding

- [ ] Production baseline identified
- [ ] Change has one clear objective
- [ ] Risk class assigned
- [ ] Impacted modules listed
- [ ] Data and permission impact listed
- [ ] Branch is not `main`

## Before merge

- [ ] Changed feature tested
- [ ] Admin test completed where applicable
- [ ] Member test completed where applicable
- [ ] Firestore Rules reviewed if touched
- [ ] Security boundary tested if touched
- [ ] Regression matrix executed for affected modules
- [ ] No unrelated files changed
- [ ] No unrelated refactor bundled into the change

## Release

- [ ] All P0 checks PASS
- [ ] Required P1/P2 checks PASS
- [ ] No known production blocker introduced
- [ ] Commit message describes the change
- [ ] Rollback point is known
- [ ] Merge to `main`
- [ ] Deploy only after merge is verified

## After release

- [ ] Production smoke test completed
- [ ] Browser console checked for new Firebase errors
- [ ] Core workflows rechecked
- [ ] Project state updated at checkpoint
- [ ] Follow-up defects recorded separately

## STOP THE LINE

Do not release when:

- a core employee workflow regresses
- a permission change is unexplained
- Firestore Rules have not been tested
- production data could be corrupted
- the change cannot be rolled back safely
