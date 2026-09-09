# legacy/

The pre-v2 Next.js app, frozen for reference. It is not part of the pnpm
workspace and is not built or typechecked. Useful for:

- checking how the old `sores` parallel arrays were written (see
  `components/image-plot/SoreSliders.tsx`) when verifying the data migration;
- copying any auth form copy or styling that has not been ported yet.

Delete this folder once production data has been migrated and verified.
