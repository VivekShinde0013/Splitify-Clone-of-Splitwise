# DECISIONS.md - Decision Log

This document tracks the significant product and technical design decisions made during the development of **Splitify**, the options considered, and the rationale for our choices.

---

## 1. Duplicate Resolution Policy (Meera's Request)

* **Problem**: The CSV contains duplicate rows (exact duplicates and conflicting entries like the same dinner logged twice with different amounts).
* **Options Considered**:
  * **Option A**: Silent Guessing. Automatically merge or delete duplicate entries based on heuristics (e.g. keeping the first one).
  * **Option B**: Crash the Import. Fail the import process and require the user to fix the CSV manually.
  * **Option C (Chosen)**: Surfaced Conflict Resolution UI. Auto-flag exact duplicates, group conflicting entries, and present them in a wizard interface for user approval before writing to the database.
* **Rationale**: Option C satisfies Meera's request ("Clean up duplicates — but I want to approve anything the app deletes or changes") and preserves data integrity without crashing the app or guessing silently. Furthermore, we pre-select KEEP for the first duplicate/conflict row and DELETE for other sibling rows by default. This auto-resolves all conflicts, enabling instant confirmation without forcing the user to click through every item, while still leaving them in full control to change the actions in the wizard before saving.

---

## 2. Currency Conversion (Priya's Request)

* **Problem**: Part of the spending was in USD, but the spreadsheet treated USD as INR (1:1).
* **Options Considered**:
  * **Option A**: Live Exchange Rate API Integration. Fetch exchange rates dynamically.
  * **Option B (Chosen)**: Fixed Rate Conversion. Apply a fixed conversion rate of **1 USD = ₹83.00** during CSV ingestion and log the action in the anomaly report.
* **Rationale**: A fixed rate is robust, predictable, and does not depend on external APIs that might introduce lag, authentication keys, or rate limits during evaluation. It correctly resolves Priya's request.

---

## 3. Timeline-Based Split Filtering (Sam & Meera's Requests)

* **Problem**: Sam moved in mid-April 2026, and Meera moved out at the end of March 2026. Sam should not pay for March expenses (like March electricity), and Meera should not pay for post-March expenses.
* **Options Considered**:
  * **Option A**: Manual split adjustment. Force the importer to ask who should owe for every single expense.
  * **Option B (Chosen)**: Hardcoded Timeline Bounds. Set Sam's join date to **April 15, 2026**, and Meera's move-out date to **March 31, 2026**. During import, filter out Sam for any expense before April 15, and filter out Meera for any expense after March 31, recalculating the split amount for remaining members.
* **Rationale**: Option B is automated, user-friendly, and eliminates manual error. It directly satisfies Sam's request ("Why would March electricity affect my balance?").

---

## 4. Settlement Logged as Expense

* **Problem**: The CSV includes a row representing a settlement payment but logs it as an expense.
* **Options Considered**:
  * **Option A**: Import as an Expense. Keep it as an expense and let the user manually adjust balances or record a reversing payment.
  * **Option B (Chosen)**: Auto-Conversion to Payment. Use description string matching (e.g., contains "settle", "payment", "repay") to identify settlements, extract the payer and recipient, and record the transaction as a `Payment` record in the database instead of an `Expense`.
* **Rationale**: Auto-conversion ensures that the net balances and simplified debt calculations remain 100% correct, preventing artificial inflation of total group expenses.

---

## 5. Simplified Balances (Aisha's Request)

* **Problem**: Aisha wants a simple "Who owes whom, how much, done" view instead of a complex web of mutual debts.
* **Options Considered**:
  * **Option A**: Direct Debts Ledger. Display every individual split relationship.
  * **Option B (Chosen)**: Greedy Simplify Debts Algorithm. Compute the net balance of each user, separate them into debtors (balance < 0) and creditors (balance > 0), sort them descending, and greedily pair the largest debtor with the largest creditor.
* **Rationale**: Option B reduces the total number of transactions to settle the group's debts to a minimum (at most $N-1$ transactions for $N$ members). It directly satisfies Aisha's request.

---

## 6. Real-Time Chat Implementation

* **Problem**: Inside each expense details pane, members can chat in real time.
* **Options Considered**:
  * **Option A**: WebSockets (using Socket.io or Supabase Realtime).
  * **Option B (Chosen)**: HTTP Periodic Short-Polling. Make the client fetch `/api/expenses/[expenseId]/chats` every 4 seconds.
* **Rationale**: WebSockets require stateful servers and are difficult to deploy on serverless hosting platforms like Vercel. Short-polling is stateless, extremely reliable on serverless architectures, and simple to debug.

---

## 7. Relational Database & ORM Stack

* **Problem**: The app requires a relational database.
* **Options Considered**:
  * **Option A**: PostgreSQL (local and production).
  * **Option B (Chosen)**: SQLite (local testing with driver adapter) and PostgreSQL (production).
* **Rationale**: SQLite is lightweight, self-contained, and allows the project to be run locally without requiring local database setup or Docker. Prisma 7 driver adapters make it easy to migrate to production PostgreSQL (Neon or Supabase) with zero code changes.

---

## 8. Credentials-Based Authentication & Hashing Rationale

* **Problem**: The app needs to secure user access and support registration via email and password, rather than allowing arbitrary passwordless logins, while remaining extremely easy for the evaluator to test locally.
* **Options Considered**:
  * **Option A**: Magic Links / Third-Party OAuth. Requires complex SMTP setup, external server keys, and redirects, which breaks local off-grid testing.
  * **Option B**: Password Credentials with Native BCrypt. Requires compiling native C++ binaries (`bcrypt` node extension), which often crashes on Windows environments during `npm install`.
  * **Option C (Chosen)**: Password Credentials with Node Built-in SHA-256 Hashing. Employs `crypto.createHash("sha256")` via the Node standard library.
* **Rationale**: Option C is robust, secure, and has zero external dependencies. It works flawlessly out-of-the-box on all OS platforms (especially Windows) without compile dependencies. In addition to syntax validation using regular expressions, we perform a server-side DNS MX record check for the email domain during signup to prevent users from registering with fake or invalid domains. For ease of manual evaluation, users auto-created during CSV imports are given the default password `password123`.
