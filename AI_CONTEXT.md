# AI_CONTEXT.md - Splitwise Clone Source of Truth

This file contains the complete working context used to generate the Splitwise Clone application. It serves as the single source of truth for the project.

---

## 1. Product Understanding & Scope

The application is a simplified clone of **Splitwise** built as a web application. It helps users split bills, track debts, chat about expenses, and settle balances within groups.

### Core Workflows
1. **User Authentication**: Simple passwordless login. Users enter their name and email. If the email doesn't exist, an account is created.
2. **Group Management**:
   - Create a group.
   - Invite/add other registered users to the group.
   - Remove users from the group (only allowed if they have a net balance of zero in the group).
3. **Expense Management**:
   - Create an expense within a group, specifying the description, total amount, payer, and split method.
   - Split methods supported:
     - **Equally**: Split evenly among all selected members.
     - **Unequally**: Specify exact monetary amounts for each member.
     - **By Percentage**: Specify percentages for each member (must sum to 100%).
     - **By Share**: Specify shares for each member (e.g. 1 share, 2 shares).
4. **Expense Chat**:
   - Inside each expense, members can chat.
   - Chat uses periodic polling (short-polling) to fetch new messages and display them.
5. **Balances & Settlements**:
   - Calculate group-wise balances and individual balance summaries.
   - Record a settlement payment (e.g., User A paid User B $X) to settle debts.

---

## 2. Technical Stack

- **Frontend**: Next.js App Router (React) with Tailwind CSS.
- **Backend API**: Next.js API Routes (Serverless endpoints under `/api/*`).
- **Database**: PostgreSQL (via Supabase or Neon).
- **ORM**: Prisma ORM for database connection, schema migration, and type-safe queries.
- **Real-time Method**: HTTP Short-polling (every 3–5 seconds) for chat updates.
- **Hosting**: Vercel (Frontend & Backend API), Supabase/Neon (PostgreSQL Database).

---

## 3. Database Schema

We use PostgreSQL with the following Prisma models:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String
  createdAt     DateTime       @default(now())
  
  // Relations
  memberships   GroupMember[]
  paidExpenses  Expense[]      @relation("ExpensePayer")
  splits        ExpenseSplit[]
  sentPayments  Payment[]      @relation("PaymentSender")
  rcvdPayments  Payment[]      @relation("PaymentReceiver")
  chatMessages  ChatMessage[]
}

model Group {
  id          String        @id @default(uuid())
  name        String
  createdAt   DateTime      @default(now())
  
  // Relations
  members     GroupMember[]
  expenses    Expense[]
  payments    Payment[]
}

model GroupMember {
  id        String   @id @default(uuid())
  groupId   String
  userId    String
  joinedAt  DateTime @default(now())
  
  // Relations
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

model Expense {
  id          String         @id @default(uuid())
  groupId     String
  description String
  amount      Float          // Represented as double precision
  paidById    String
  splitType   String         // "EQUAL", "UNEQUAL", "PERCENTAGE", "SHARE"
  createdAt   DateTime       @default(now())
  
  // Relations
  group       Group          @relation(fields: [groupId], references: [id], onDelete: Cascade)
  paidBy      User           @relation("ExpensePayer", fields: [paidById], references: [id], onDelete: Cascade)
  splits      ExpenseSplit[]
  chatMessages ChatMessage[]
}

model ExpenseSplit {
  id         String   @id @default(uuid())
  expenseId  String
  userId     String
  amount     Float    // The calculated amount this user owes
  ratioVal   Float?   // Optional field to store percentage or share value entered
  
  // Relations
  expense    Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([expenseId, userId])
}

model Payment {
  id         String   @id @default(uuid())
  groupId    String
  fromUserId String   // Debtor
  toUserId   String   // Creditor
  amount     Float
  createdAt  DateTime @default(now())
  
  // Relations
  group      Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  fromUser   User     @relation("PaymentSender", fields: [fromUserId], references: [id], onDelete: Cascade)
  toUser     User     @relation("PaymentReceiver", fields: [toUserId], references: [id], onDelete: Cascade)
}

model ChatMessage {
  id        String   @id @default(uuid())
  expenseId String
  userId    String
  message   String
  createdAt DateTime @default(now())
  
  // Relations
  expense   Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 4. Balance Calculation Logic

The net balance of User $U$ in Group $G$ determines how much money they are owed (positive) or owe to others (negative).

$$\text{Net Balance}_{U, G} = \text{Total Paid by } U \text{ as payer} - \text{Total Owed by } U \text{ in splits} - \text{Total Received by } U \text{ in settlements} + \text{Total Settled by } U \text{ in settlements}$$

Where:
1. **Total Paid by $U$**: Sum of `amount` of all `Expense` records in Group $G$ where `paidById` = $U$.
2. **Total Owed by $U$**: Sum of `amount` of all `ExpenseSplit` records in Group $G$ where `userId` = $U$.
3. **Total Received by $U$**: Sum of `amount` of all `Payment` records in Group $G$ where `toUserId` = $U$.
4. **Total Settled by $U$**: Sum of `amount` of all `Payment` records in Group $G$ where `fromUserId` = $U$.

A user can only be removed from group $G$ if $\text{Net Balance}_{U, G} = 0$.

---

## 5. API Design

All endpoints return JSON and are located under `/api/`.

### Auth
- `POST /api/auth/login`: `{ email, name }` -> returns User object, sets cookie or responds with User ID.

### Users
- `GET /api/users`: Search/list all registered users to invite them to groups.

### Groups
- `POST /api/groups`: `{ name }` -> Creates a group and automatically joins the creator.
- `GET /api/groups`: Get all groups the current user is a member of.
- `GET /api/groups/[groupId]`: Get details of a single group including members, expenses, and payments.
- `POST /api/groups/[groupId]/members`: `{ userId }` -> Add a user to the group.
- `DELETE /api/groups/[groupId]/members/[userId]`: Remove a member (errors if net balance is not zero).

### Expenses
- `POST /api/groups/[groupId]/expenses`: `{ description, amount, paidById, splitType, splits: [{ userId, value }] }` -> Creates expense and corresponding splits.
- `GET /api/expenses/[expenseId]`: Get details of a single expense with its splits and chat messages.

### Payments (Settlements)
- `POST /api/groups/[groupId]/payments`: `{ fromUserId, toUserId, amount }` -> Record a payment.

### Chat
- `GET /api/expenses/[expenseId]/chats`: Get all chat messages.
- `POST /api/expenses/[expenseId]/chats`: `{ message }` -> Send a message.

---

## 6. UI & Frontend Structure

A sleek, premium, responsive web interface built with Tailwind CSS.

### Pages/Views
1. **Login Screen**: Sleek card layout, passwordless name and email login.
2. **Dashboard**: 
   - Left side: List of groups.
   - Right side: Summary of overall outstanding balances (Total you owe, Total you are owed).
3. **Group View**:
   - Header with Group name and "Add Expense" / "Settle Up" buttons.
   - List of active group members and their group-specific net balance.
   - List of expenses and settlements. Clicking an expense opens the Detail & Chat modal.
   - Ability to add or remove group members.
4. **Add Expense Modal**:
   - Inputs for Description, Amount, Payer, and Split Type.
   - Dynamic form elements based on split type:
     - Equal: checkboxes for who is included.
     - Unequal: input boxes for exact amounts.
     - Percentage: input boxes for percentages (validates total is 100%).
     - Share: input boxes for shares.
5. **Expense Detail & Chat Modal**:
   - Shows the exact breakdown of who paid and who owes how much.
   - Chat feed at the bottom with periodic short-polling updates.

---

## 7. Known Trade-Offs & Limitations

1. **Authentication**: Passwordless email/name authentication is used for demonstration simplicity. In production, this would use OAuth/JWT with secure passwords.
2. **Real-time Chat**: Polling is selected over WebSockets because it is lightweight, simple to deploy on serverless platforms (Vercel), and does not require a persistent WebSocket connection manager.
3. **Currency**: The application assumes a single default currency (INR / `₹`) for simplicity.
