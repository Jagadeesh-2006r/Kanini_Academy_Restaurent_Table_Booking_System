# Academic Write-up: Architectural Design Choices & System Evaluation

**Project Title:** Restaurant Table Reservation System  
**Prepared For:** College Examination & Jury Evaluation  
**Author:** Software Engineering Student  

---

## 1. Executive Summary & Design Choices

The goal of this project was to design and implement an end-to-end web portal that solves the operational bottlenecks of multi-branch restaurant dining: double booking risks, sub-optimal table allocation, and lack of role segregation.

### Architectural Decisions

1. **Relational PostgreSQL over NoSQL (MongoDB):**
   - *Rationale:* Restaurant reservations require rigid relational constraints (e.g., a reservation references a specific table, customer, and branch). Referential integrity via Foreign Keys (`ON DELETE RESTRICT` for tables with active bookings) ensures that historical audit trails are preserved even if a physical table is decommissioned.
   - *Trade-off:* Relational migrations require upfront schema discipline compared to document stores, but eliminate orphan or conflicting records.

2. **ACID Transaction Concurrency Locking:**
   - *Rationale:* A major vulnerability in high-traffic reservation systems is the "time-of-check to time-of-use" (TOCTOU) race condition, where two users check availability simultaneously and book the same table.
   - *Implementation:* All allocation logic runs inside `prisma.$transaction()`. Within the transaction, the candidate table set is queried with an overlap filter (`existing.startTime < new.endTime AND existing.endTime > new.startTime`). If any conflict is detected, the transaction either assigns the next suitable table or aborts with HTTP 409 Conflict.

3. **Smallest-Table Greedy Allocation Algorithm:**
   - *Rationale:* If a party of 2 is allocated an 8-person banquet table, the restaurant loses revenue potential when a large party arrives.
   - *Implementation:* Active tables are filtered by `capacity >= partySize` and sorted ascending by capacity. The algorithm picks the first available table, maximizing floor efficiency without manual hostess guesswork.

4. **Role-Based Access Control (RBAC):**
   - Three independent roles (Customer, Staff, Admin) share a unified authentication gateway using JSON Web Tokens (JWT).
   - Staff accounts are strictly scoped to their assigned `branchId` at the database middleware layer (`WHERE branchId = req.user.branchId`), ensuring staff at Branch A cannot inspect Branch B's revenue or guest lists.

---

## 2. Known Gaps & Constraints

While the core functional requirements (FR-01 through FR-16) and business rules are fully met and persistent in PostgreSQL, the following constraints exist in the current scope:

1. **Table Combination Logic:**
   - Currently, a reservation must fit into a single existing table's capacity. If a party of 14 arrives, but the maximum single table holds 10, the system returns "No suitable table available." It does not currently merge two adjacent 8-person tables into a 16-person combined table.
2. **SMS Gateway Integration:**
   - Reservation alerts are stored permanently in the PostgreSQL `notifications` table and rendered in real-time in the user interface. Live SMS dispatch via Twilio/Vonage was not connected to avoid paid carrier API keys.
3. **Credit Card Guarantee / Pre-payment:**
   - The current workflow provides free table holds. High-end restaurants often require a deposit to deter no-shows.

---

## 3. Future Improvements Roadmap

If granted an extended development cycle, the following enhancements would be prioritized:

1. **Dynamic Table Merging Algorithm:**
   - Implement a bipartite graph matching or knapsack algorithm to automatically group adjacent physical tables for large groups.
2. **Interactive 2D Floor Map Visualization:**
   - Utilize HTML5 Canvas or SVG to render a real-time visual floor plan where hostesses can drag and drop reservations onto tables with color-coded occupancy statuses (Reserved, Seated, Dining, Check Cleared).
3. **Automated No-Show Cancellation via Scheduled Cron Jobs:**
   - Implement background worker jobs to automatically transition status from `BOOKED` to `NO_SHOW` if a guest has not checked in within 20 minutes of their slot start time, instantly freeing the table for walk-ins.
4. **Third-Party Calendar Integration:**
   - Add `.ics` calendar sync (Google Calendar / Apple iCal) upon reservation confirmation.

