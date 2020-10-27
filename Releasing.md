# Release process

This NPM package has a defined release process, documented here.

## Outline

1. When the time comes to release a new version, write up release notes for the
   new version.  These go in the [changelog](./ChangeLog.md), documenting any
   changes made since the last release.
2. Update the version number in `package.json`.
3. Check that the `develop` branch is ahead of `master` (i.e. it is a fast
   forward of `master`) to ensure that there are no dangling features missing
   from `develop`.
4. Cut a release (or release candidate) branch from `develop` with a properly
   formatted branch name.  For example if the new version number is 1.5.7, the
   appropriate branch name is `release/1.5.7`.
5. The full quality assurance (QA) testing process should be performed on this
   release branch.  If QA uncovers release-blocking issues, and a quick patch is
   needed, new commits may be applied directly to the release branch.  (After
   the release is pushed to `master`, `develop` can be rebased on `master`.)
   Alternatively to avoid rebasing and provide more structure to the QA process,
   commits can be added to `develop` first and then a new release branch with
   `-rcN` appended can be created based on that. For example,
   `release/1.5.7-rc2` would be the third release candidate created since we
   assume a zero-indexed value of N; in other words, the very first release
   branch for a particular version is considered equivalent to `-rc0` regardless
   of whether it was actually named so.
6. Once QA passes, merge the release branch into `master`, tag, and push to
   GitHub.  The resulting merge commit should be tagged with a properly formatted
   annotated tag, e.g. `v1.5.7` for the previously given version number.
   ```
   git checkout master
   git tag -a vX.Y.Z
   git push --tags origin
   ```
7. Finally, the `yarn publish` command (for Yarn Classic/v1) can be used to pack
   and upload the new release to the NPM registry.
