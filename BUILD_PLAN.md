# BUILD_PLAN.md - Splitwise Clone Build Plan

This document summarizes the product research, architecture, AI collaboration, and trade-offs for our Splitwise Clone web app assignment.

---

## 1. Product Research & Assumptions

### Studying Splitwise
- **Core Value Proposition**: Minimizing the friction of splitting costs among groups of friends.
- **Key Concepts**:
  - Groups represent isolated pools of expenses (e.g. "Roommates", "Trip to Paris").
  - Each expense is paid by one member and split among a subset of members.
  - Settle Up payments are special transactions that do not represent new expenses but instead pay back existing debt.
  - Balances are simplified when possible: rather than A paying B and B paying C, A can pay C directly.

### Product Assumptions & Scope
- **Assumed Simplifications**:
  - The application operates on a single currency (e.g., INR `₹`).
  - There is no need for real email invitations; we can search and add users who are already registered in the system.
  - A user can only be removed from a group if their net balance in that specific group is exactly `0`.
  - Splitting calculations will round to 2 decimal places. Any rounding errors (e.g., ₹10 split 3 ways results in ₹3.33 + ₹3.33 + ₹3.34) will be resolved by adjusting the share of the payer or first member.

---

## 2. Architecture

### Tech Stack
- **Frontend & Backend**: Next.js (App Router) using React 18, React hooks, and Tailwind CSS.
- **Database**: PostgreSQL (Supabase / Neon serverless database).
- **ORM**: Prisma ORM.
- **Real-Time Client**: HTTP Periodic Short-Polling (every 4 seconds) to update chat rooms.

### Database Schema
- Relational design consisting of `User`, `Group`, `GroupMember`, `Expense`, `ExpenseSplit`, `Payment`, and `ChatMessage`.
- Primary keys are UUID strings for high safety and ease of deployment.
- Deletions are cascaded to clean up dependent records when a group or user is removed.

### API Design
- RESTful HTTP JSON routes under `/api`.
- Client communicates with `/api/auth`, `/api/groups`, `/api/expenses`, `/api/payments`, and `/api/users`.

### Deployment Approach
- Deploy the Next.js frontend and API endpoints to **Vercel** (connect GitHub repository to Vercel for automatic CI/CD).
- Host the PostgreSQL database on **Neon or Supabase**.

---

## 3. AI Collaboration Process

1. **Initial Prompt & Instructions**:
   - The user initialized the assistant with instructions to behave like a junior engineer.
   - The AI did not assume requirements and began by interviewing the user.
2. **Key Questions Asked by AI**:
   - Choosing between split stacks vs. Next.js unified stack.
   - Selecting the database type (PostgreSQL vs. SQLite).
   - Choosing the authentication complexity (Passwordless login vs. JWT/Credentials).
   - Selecting the real-time chat mechanism (polling vs. websockets).
3. **User Answers**:
   - Chose Next.js App Router for unified dev and easy hosting.
   - Selected PostgreSQL via Supabase/Neon.
   - Selected passwordless login (name + email login) for simplicity and fast demoing.
   - Selected HTTP Periodic Short-Polling for chat to enable hassle-free serverless hosting.
4. **Context Maintenance**:
   - `AI_CONTEXT.md` was initialized as the single source of truth detailing the technical choices, formulas, and schema.

---

## 4. Trade-offs & Simplifications

### What is simplified
- **No Passwords**: The login module allows any user to log in by typing their email. If the email doesn't exist, it creates a user. This makes it incredibly easy for the reviewer/grader to log in as multiple different users in different browser tabs to test the splitting and real-time chat.
- **Short Polling**: Instead of maintaining a stateful WebSocket server (which is expensive and difficult to scale on free serverless platforms), the chat updates using client-side React intervals.

### What is avoided
- **Multi-currency**: We avoid exchanging money rates to keep calculations precise and clean.
- **Complex Settlement Optimization**: We use direct balances between users instead of generating a global minimum transaction graph, keeping the settlement records transparent.

### Future Improvements
- Implement Google/GitHub OAuth or Auth0 for production security.
- Add WebSockets with Supabase Realtime or Socket.io.
- Add receipt OCR parsing using Tesseract.js or Cloud Vision API.
