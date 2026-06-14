# AI_USAGE.md - AI Tool Usage & Error Log

This document lists the AI tools used, the key prompts executed, and three concrete cases where the AI generated incorrect code, how the error was caught, and how it was resolved.

---

## 1. AI Tools Used

* **AI Agent / Assistant**: Google DeepMind's Antigravity coding agent.
* **Core Tasks**: Implementation of the CSV parsing engine, anomaly resolution handlers, duplicate resolver UI, debt breakdowns, database migration schema, and project documentation.

---

## 2. Key Prompts

### Start of Phase 7 (CSV Import Pipeline)
> "Let's implement the CSV importer pipeline and anomaly detection rules according to the Spreetail specifications. We need a backend API `/api/groups/[groupId]/import` to parse raw CSV, flag the 12 anomalies (USD currency, Sam/Meera timelines, settlements, duplicates), and a resolver UI for Meera to approve duplicates before writing to the database."

### Start of Phase 8 (Debt Breakdown)
> "Rohan wants to see exactly which expenses make up what he owes. Modify page.tsx to add a click handler on the simplified debt list. When clicked, it should calculate the exact ledger entries (his split shares, his paid expenses, and settlements) between the debtor and creditor and display them in a list."

### Start of Phase 10 (Credentials-Based Auth)
> "i want to add ID and password also for login and sign up do that changes and also do changes according to it in documentation also"

### Start of Phase 11 & 12 (Email Verification & CSV Conflict Pre-selection)
> "in this if we use fake email still it is signing up with it and also after importing csv and do changes if i click on confirm import it is not giving any responce it says please resolve all confliting duplicate before proceeding make it able to solve conflicts and proceed further"
> "Verify that the email domain actually exists and is active (e.g., performing a DNS MX lookup to see if it can receive emails)."

---

## 3. AI Mistakes & Resolutions

### Case 1: Prisma 7 SQLite Driver Adapter Setup
* **What the AI did wrong**: The AI suggested standard Prisma Client imports and queries without configuring driver adapters. In Prisma 7, SQLite database access within Next.js server actions / routes requires explicit driver adapters (`@prisma/adapter-better-sqlite3`) and a `prisma.config.ts` file. Without this, standard imports fail with runtime platform errors.
* **How it was caught**: Running `next dev` and trying to login threw compile and runtime failures saying SQLite is not supported natively in this environment.
* **What was changed to fix it**: We configured `prisma.config.ts`, added `better-sqlite3` and the Prisma adapter to `package.json`, and structured `src/lib/db.ts` to initialize Prisma Client using `PrismaBetterSqlite3` with the adapter:
  ```typescript
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
  prisma = new PrismaClient({ adapter });
  ```

### Case 2: React State Rehydration Infinite Loop
* **What the AI did wrong**: The AI set up the `useEffect` hooks in `src/app/page.tsx` with circular dependencies. For example, fetching group details updated the `groupDetails` state, which triggered another fetch hook because the dependency array included the state object itself rather than the primitive ID string.
* **How it was caught**: The browser tab locked up, and the developer console showed thousands of duplicate network requests to `/api/groups/[groupId]` per second.
* **What was changed to fix it**: We isolated the effects and restricted the dependency arrays to primitive IDs:
  ```typescript
  // Triggered ONLY when activeGroupId changes, not on general state updates
  useEffect(() => {
    if (activeGroupId) {
      fetchGroupDetails(activeGroupId);
    }
  }, [activeGroupId]);
  ```

### Case 3: Math Rounding & Transaction Split Discrepancies
* **What the AI did wrong**: In the initial split calculations, the AI performed standard division `amount / N` for equal splits. This left fractional float remainders (e.g. ₹1000 split between 3 people created shares of ₹333.3333333333333). When rounded to database double precision (₹333.33 each), the sum of splits (₹999.99) did not equal the total expense amount (₹1000.00), triggering database write failures.
* **How it was caught**: Creating expenses with equal splits that had rounding errors crashed the `/api/groups/[groupId]/expenses` endpoint and threw SQLite transaction failures.
* **What was changed to fix it**: We updated the splits calculator to distribute a base split amount rounded to two decimals, and assigned the final mathematical remainder to the last participant:
  ```typescript
  const baseVal = Number((amount / N).toFixed(2));
  let sum = 0;
  splits.forEach((s, idx) => {
    const itemAmount = idx === N - 1 ? Number((amount - sum).toFixed(2)) : baseVal;
    sum += itemAmount;
    // ...
  });
  ```
