# Key Prompts Used for Splitify (Splitwise Clone)

This document contains the step-by-step prompts you can copy-paste into a public AI tool (like **Claude** or **ChatGPT**) to create a shareable conversation link for your HR evaluator. These prompts correspond exactly to the structure and code we built for your project.

---

## Step 1: Start the Interview (Initial Prompt)
*Copy and paste this prompt as your very first message to the AI. This is the exact prompt required by page 3 of the PDF.*

```text
"You are a junior engineer helping me complete an internship assignment.

The assignment is to reverse engineer Splitwise, scope a realistic 3-day version, and build a working deployed app.

Important instructions:
1. Do not assume product requirements.
2. Do not jump directly into implementation.
3. Ask me detailed questions about product scope, UX, workflows, edge cases, and engineering decisions.
4. Ask about every implementation detail needed to build the app.
5. After each answer I give, update a Markdown file called AI_CONTEXT.md.
6. AI_CONTEXT.md must become the source of truth for the entire project.
7. The final app must be buildable from AI_CONTEXT.md.
8. Another evaluator should be able to paste AI_CONTEXT.md into the same AI tool and recreate a similar app.
9. Before writing code, produce a build plan based only on the agreed context.
10. During implementation, keep updating AI_CONTEXT.md whenever requirements, architecture, schema, UI, or logic changes.
11. Do not recommend technical solutions. Your job is to let me think through the technical solution.

Start by interviewing me.
Ask questions across:
- product goals
- Splitwise research
- core workflows
- user personas
- MVP scope
- out-of-scope features
- data model !IMPORTANT!
- authentication
- groups
- expenses
- settlements
- balance calculation
- UI screens
- routing
- frontend architecture
- backend architecture
- database choice
- API design
- deployment
- testing
- known risks
- tradeoffs

Do not give me a final plan until you have asked enough questions."
```

---

## Step 2: Answer the AI's Questions
*After the AI responds with its list of interview questions, paste this answer block. This contains the decisions that match our current codebase.*

```text
Here are my decisions for the project. Please write them down and prepare the AI_CONTEXT.md and BUILD_PLAN.md:

1. Product Goals & Scope:
- We want a responsive web application clone of Splitwise called "Splitify".
- Focus: Group bill splitting, balance calculations, settlements, and expense-level chat.
- Out of scope: OCR receipt scanning, multi-currency support, email invitations, and payment gateway integrations.

2. Tech Stack & Architecture:
- Frontend & Backend: Next.js (App Router, React 19) with Tailwind CSS.
- Relational Database: SQLite for local testing, PostgreSQL (via Supabase or Neon) for production.
- ORM: Prisma ORM (v7) with driver adapters (@prisma/adapter-better-sqlite3 for local SQLite, @prisma/adapter-pg for PostgreSQL).
- Real-time chat: HTTP Periodic Short-Polling (fetching new messages every 4 seconds from the frontend) for easy serverless deployment.

3. Core Workflows:
- Authentication: Simple passwordless credentials. Users log in by typing their name and email. If the user doesn't exist, we create one automatically.
- Groups: Users can create a group, search and add other users by email, and remove members ONLY if their net balance is exactly zero.
- Expenses: Supports 4 split types:
  * Equal: Split evenly among selected members, handling remainder rounding by adjusting the last split.
  * Unequal: Custom amount per member (sum must equal total expense).
  * Percentage: Percentages per member (must sum to 100%).
  * Share: Custom shares (e.g. 2 shares, 1 share) per member.
- Settlements: Record payment where User A paid User B ₹X, reducing outstanding debts.
- Chat: Group chat inside each individual expense details pane.

4. Database Schema:
- Relational tables: User, Group, GroupMember (many-to-many relationship), Expense, ExpenseSplit (stores calculated share and percentage/share ratio value), Payment (settlements), and ChatMessage.

5. Calculations:
- Net Balance = (Total Paid as payer) - (Total Owed in splits) - (Total Received in payments) + (Total Paid in payments).
- Implement a greedy matching algorithm to show "Simplified Debts" (who owes whom the minimum transactions).

Please generate the AI_CONTEXT.md and BUILD_PLAN.md.
```

---

## Step 3: Generate the Database Schema
*After the AI gives you the context files, paste this prompt to generate the database schema.*

```text
Great. Now let's implement the project. 

First, write the Prisma schema for SQLite and PostgreSQL (using Prisma 7 standards). Please output the schema and show how to configure the connection client in next.js, noting that Prisma 7 requires driver adapters (like PrismaBetterSqlite3) and a prisma.config.ts config file.
```

---

## Step 4: Implement the Backend API Routes
*Next, ask the AI to implement the backend endpoints.*

```text
Let's implement the Next.js API routes under src/app/api. Please write the following route handlers using App Router standard conventions:

1. src/app/api/auth/login/route.ts: Passwordless login (finds or creates user).
2. src/app/api/users/route.ts: User listing and search.
3. src/app/api/groups/route.ts: POST to create a group, GET to list groups a user is in.
4. src/app/api/groups/[groupId]/route.ts: GET details, calculate net balances for members, and implement the greedy Simplify Debts algorithm.
5. src/app/api/groups/[groupId]/members/route.ts: POST to add a member to the group.
6. src/app/api/groups/[groupId]/members/[userId]/route.ts: DELETE to remove a member (validates that their net balance is zero first).
7. src/app/api/groups/[groupId]/expenses/route.ts: POST to create expense and splits (calculating Equal, Unequal, Percentage, and Share amounts).
8. src/app/api/groups/[groupId]/payments/route.ts: POST to record settlement payments.
9. src/app/api/expenses/[expenseId]/chats/route.ts: GET to fetch chat messages, POST to add a message.
```

---

## Step 5: Implement the Frontend UI
*Ask the AI to write the complete React UI.*

```text
Now let's build the interactive frontend page at src/app/page.tsx. Please write the complete page using React hooks and Tailwind CSS. The page must include:
- A glassmorphism Login card (displayed if no user is saved in localStorage).
- A dashboard with a Sidebar showing the group list, logged-in profile, and logout.
- A main panel showing the selected group details, activity ledger feed (chronological expenses and payments), and group balance totals.
- A right sidebar showing members (with a remove member button) and a "Simplified Debts" list.
- Modals for "Add Expense" (supporting Equal, Unequal, Percentage, and Share forms with live split calculation indicators) and "Settle Up" (recording payments).
- An "Expense Details & Chat" pane/modal that short-polls /api/expenses/[expenseId]/chats every 4 seconds to sync messages.
```

---

## Step 6: Complete the README.md
*Lastly, ask the AI to write the documentation.*

```text
Finally, write a comprehensive README.md file detailing key features, technical stack, database configuration instructions (both for SQLite and PostgreSQL Neon/Supabase), and step-by-step instructions on how to test the split and chat features locally.
```
