# Revision history for `hw-app-ckb`

This project's release branch is `master`.
This log is written from the perspective of the release branch: when changes hit `master`, they are considered released.

## v0.1.1 - 2020-10-26

Primarily a bugfix release.

- All compiled files are now included in release tarballs after `yarn pack`.
- A specific version of Nixpkgs is now pinned in `shell.nix` for developer
  convenience.
- Ledger app version hash parsing in `getAppConfiguration` has been fixed.
- Release process documentation is now included.

## v0.1.0 - 2020-09-30

This is the first release since moving this to its own repo from https://github.com/obsidiansystems/ledgerjs/tree/nervos.

### Release Notes
- Small discrepancies in the Nervos schemas between the RPC and Lumos have been worked around.
- Added `package.yaml`s for examples project and for example workspace.

This release has been tested with:
- Nervos Ledger App: [v0.5.0 - 88026362a0bbf096ae911f33be5149415a2a7c77](https://github.com/obsidiansystems/ledger-app-nervos/releases/tag/v0.5.0)
 - CKB-CLI: [b460c998d6681a89a47b3af203ecc5f12d7b2507](https://github.com/obsidiansystems/ckb-cli/commit/b460c998d6681a89a47b3af203ecc5f12d7b2507)
