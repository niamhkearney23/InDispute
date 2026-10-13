# Integration tests against a throwaway Supabase

`npm test` checks the code on its own and `supabase/tests/schema-guarantees.sql`
checks the database rules on plain Postgres. These tests check the parts that
only show up with Supabase's real services in the loop: sign-in and the
six-digit code (Supabase Auth), what a signed-in person can read through the
API (PostgREST, with the person's own token), file storage (Supabase
Storage), and the database update itself on Supabase's own Postgres image.

```bash
npm run it:up                 # start it (Docker), load SETUP.sql
npm run test:integration      # run every *.it.test.ts in tests-integration/
npm run it:down               # stop it and throw it all away

# The update path a live database takes: an older SETUP.sql, then today's
# UPDATE.sql on top. Pass the commit the live site was set up from.
tools/integration/stack.sh up b0161d8
```

The images and versions are pinned in `stack.sh`. Everything runs on this
machine; the tests refuse to run against any address that is not 127.0.0.1.
The keys in `.env.it` are made up for the throwaway stack and are not secrets.

What this is not: Supabase's hosted platform. Settings that only exist there
(email sending, the dashboard, backups, rate limits on a real project) still
need checking on a real staging project.
