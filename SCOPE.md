# SCOPE.md - Anomaly Log & Database Schema

This document details the data anomaly policies used in the **Splitify** CSV Import engine and the database schema structure of the application.

---

## 1. CSV Data Anomaly Log & Resolutions

Our importer parses `expenses_export.csv` exactly as provided and resolves at least 12 distinct types of deliberate data issues using documented system policies.

| # | Anomaly Type | Detection Rule | Policy & Resolution Action | Persona Addressed |
|---|---|---|---|---|
| **1** | **USD Currency Discrepancy** | Expense row contains "USD" or "$" in the Currency or Amount column. | Converted USD amounts to INR at a fixed exchange rate of **1 USD = ₹83.00** and logged the conversion in the import report. | **Priya's request** ("Half the trip was in dollars. The sheet pretends a dollar is a rupee.") |
| **2** | **Timeline Violation (Late Joiner)** | Expense date is before **April 15, 2026** and Sam is listed in the split participants. | Excluded Sam from splits for any expenses dated before April 15, 2026. Recalculated and distributed the split amount among the remaining active members. | **Sam's request** ("I moved in mid-April. Why would March electricity affect my balance?") |
| **3** | **Timeline Violation (Early Leaver)** | Expense date is after **March 31, 2026** and Meera is listed in the split participants. | Excluded Meera from splits for any expenses dated after March 31, 2026. Recalculated and distributed the split amount among the remaining active members. | **Meera's request** (moved out at the end of March) |
| **4** | **Timeline Violation (Payer Late Join / Leave)** | Expense date is out of bounds for the listed payer (e.g., Sam pays in March or Meera pays in April). | Logged a warning anomaly in the report to notify the group of inconsistent billing. | All flatmates |
| **5** | **Settlement Logged as Expense** | Expense description contains keywords like "settle", "payment", "repay", or "paid back". | Intercepted and recorded the row as a `Payment` record in the database instead of an `Expense` record. | Aisha / Group Balances |
| **6** | **Negative Amount (Refund)** | Amount value is less than 0. | Treated as a Refund. Created an expense with negative split balances, which correctly reverses the credit and debt flows. | Group Ledger |
| **7** | **Exact Duplicate Row** | Identical rows with same Date, Description, Amount, Payer, and Split members. | Grouped duplicates. Kept the first row, auto-flagged duplicates to be discarded, and surfaced them for approval in the Duplicate Resolver UI. | **Meera's request** ("Clean up the duplicates — but I want to approve anything...") |
| **8** | **Conflicting Duplicate** | Rows on same Date, Payer, and Description but with different amounts (e.g., same dinner logged twice with different costs). | Flagged as a conflict. Surfaced in the Duplicate Resolver UI, blocking import until the user manually selects which transaction wins. | **Meera's request** ("Two people logged same dinner with different amounts") |
| **9** | **Missing Date / Invalid Format** | Date cell is empty or does not parse as a valid ISO/American date. | Defaulted the transaction date to the current date and flagged a warning in the import report. | Importer Reliability |
| **10** | **Missing Description** | Description cell is empty. | Defaulted the description to "Imported Shared Expense" and flagged a warning. | Importer Reliability |
| **11** | **Payer Not in Group** | Payer name is misspelled or does not match existing group members. | Auto-created the user using a normalized system email (e.g., `rohans@example.com` for "Rohan S") and added them as a member of the group. | User Management |
| **12** | **Split Participant Not in Group** | Split names include people not registered in the group. | Auto-created the unregistered participants, added them to the group, and recalculated the splits. | User Management |

---

## 2. Database Schema

Splitify is built using a relational database design managed via **Prisma ORM**. The schema supports SQLite (local development) and PostgreSQL (production).

```mermaid
erDiagram
    User ||--o{ GroupMember : "has memberships"
    User ||--o{ Expense : "pays expenses"
    User ||--o{ ExpenseSplit : "owes splits"
    User ||--o{ Payment : "sends/receives payments"
    User ||--o{ ChatMessage : "posts chat messages"
    Group ||--o{ GroupMember : "has members"
    Group ||--o{ Expense : "has expenses"
    Group ||--o{ Payment : "has payments"
    Expense ||--o{ ExpenseSplit : "has splits"
    Expense ||--o{ ChatMessage : "has chats"

    User {
        String id PK
        String email UNIQUE
        String name
        String password
        DateTime createdAt
    }
    Group {
        String id PK
        String name
        DateTime createdAt
    }
    GroupMember {
        String id PK
        String groupId FK
        String userId FK
        DateTime joinedAt
    }
    Expense {
        String id PK
        String groupId FK
        String description
        Float amount
        String paidById FK
        String splitType
        DateTime createdAt
    }
    ExpenseSplit {
        String id PK
        String expenseId FK
        String userId FK
        Float amount
        Float ratioVal
    }
    Payment {
        String id PK
        String groupId FK
        String fromUserId FK
        String toUserId FK
        Float amount
        DateTime createdAt
    }
    ChatMessage {
        String id PK
        String expenseId FK
        String userId FK
        String message
        DateTime createdAt
    }
```

### Key Models & Fields
- **`User`**: Core user accounts. Emails are normalized to lowercase. Passwords are secure SHA-256 hashes generated from credentials login/signup.
- **`GroupMember`**: Many-to-many join table connecting users and groups with a unique constraint on `[groupId, userId]`.
- **`Expense`**: Logged purchases. Split type is stored as a string enum (`EQUAL`, `UNEQUAL`, `PERCENTAGE`, `SHARE`).
- **`ExpenseSplit`**: Represents each user's liability for an expense. `amount` stores their calculated share in INR, while `ratioVal` stores the original ratio/percentage/shares for mathematical auditability.
- **`Payment`**: Independent settlement records representing payments directly from a debtor (`fromUserId`) to a creditor (`toUserId`).
- **`ChatMessage`**: Text messages linked to specific expenses, allowing localized discussions.
