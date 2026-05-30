You are reading Cursor BugBot's latest review comments from the current PR and forming a fix plan.

1. Identify the current PR and repo:
   ```
   gh repo view --json nameWithOwner
   gh pr view --json number,title
   ```

2. Fetch all review threads via GraphQL (gives resolved status + thread IDs in one call):
   ```
   gh api graphql -f query='
     query($owner:String!, $repo:String!, $pr:Int!) {
       repository(owner:$owner, name:$repo) {
         pullRequest(number:$pr) {
           reviewThreads(first:100) {
             nodes {
               id
               isResolved
               comments(first:5) {
                 nodes {
                   author { login }
                   body
                   path
                   line
                 }
               }
             }
           }
         }
       }
     }
   ' -f owner=OWNER -f repo=REPO -F pr=NUMBER
   ```

3. Filter threads: keep only those where any comment's `author.login` contains "bugbot" or "cursor". **Skip any thread where `isResolved` is true.**

4. For each unresolved BugBot thread, note:
   - Thread ID (needed for resolution later)
   - File path + line
   - The issue described

5. Output a numbered fix plan — one item per unresolved thread, one line each: what to fix and where. Do not implement fixes yet — present the plan for user approval first.

## After implementing each fix

Once a fix is committed and pushed, resolve the corresponding BugBot thread:
```
gh api graphql -f query='
  mutation($threadId:ID!) {
    resolveReviewThread(input:{threadId:$threadId}) {
      thread { isResolved }
    }
  }
' -f threadId=THREAD_ID
```

Resolve each thread immediately after its fix is committed — do not batch them at the end.
