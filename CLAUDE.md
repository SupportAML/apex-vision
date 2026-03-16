# Apex Vision

## Git Workflow (READ THIS FIRST)

Direct pushes to `main` are blocked by the environment proxy. You will get a 403 error if you try. Do not waste time debugging branch protection rules or rulesets -- they are not the issue.

### How to push your changes

1. **Always work on your assigned `claude/` branch.** Your session will have a branch like `claude/some-task-XXXXX`. Develop and commit there.
2. **Push to your `claude/` branch.** Use `git push -u origin claude/your-branch-name`. This will succeed.
3. **Do NOT push to `main` directly.** It will fail with a 403 every time. Do not retry, do not investigate settings -- it is blocked by design.
4. **To get changes into `main`, create a Pull Request.** Use `gh pr create` if available, or inform the user that a PR is needed to merge.

### If you hit a 403 on push

- If you're pushing to `main`: stop. Switch to your `claude/` branch and push there instead.
- If you're pushing to a `claude/` branch and it fails: retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s) as it may be a network issue.
