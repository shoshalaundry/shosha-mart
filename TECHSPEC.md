# Technical Specification: B2B Internal Marketplace

## 1. Tech Stack & Tools
* **Framework:** Next.js 16 (App Router)
* **Library UI:** React 19
* **Styling:** TailwindCSS
* **UI Components:** shadcn/ui
* **Database:** Turso (libSQL/SQLite Cloud)
* **ORM:** Drizzle ORM
* **Authentication:** NextAuth.js / Jose (Custom Implementation: No Signup)
* **State Management:** React Server Components (Server-side) & TanStack Query (Client-side)

---

## 2. Database Schema (Drizzle/SQLite)



### `users` Table
| Column | Type | Constraints | Note |
| :--- | :--- | :--- | :--- |
| **id** | text | Primary Key | UUID |
| **username** | text | Unique | Login identifier (Unique) |
| **phone** | text | Unique | Login identifier (Unique) |
| **password** | text | - | Hashed password |
| **role** | text | - | 'SUPERADMIN', 'ADMIN_TIER', 'BUYER' |
| **tier_id** | text | Foreign Key | Relation to `tiers` (Null for SuperAdmin) |
| **branch_name** | text | - | Branch name (Only for BUYER role) |

### `tiers` Table
| Column | Type | Constraints | Note |
| :--- | :--- | :--- | :--- |
| **id** | text | Primary Key | UUID |
| **name** | text | Unique | 'L24J' or 'SHOSHA' |

### `products` Table
| Column | Type | Note |
| :--- | :--- | :--- |
| **id** | text | Primary Key |
| **name** | text | Product Name |
| **sku** | text | Stock Keeping Unit |
| **base_price** | integer | Base cost (Visible only to SuperAdmin) |

### `tier_prices` Table (Dynamic Pricing)
| Column | Type | Note |
| :--- | :--- | :--- |
| **id** | text | Primary Key |
| **product_id** | text | Foreign Key to `products` |
| **tier_id** | text | Foreign Key to `tiers` |
| **price** | integer | Specific price for the assigned tier |

### `orders` Table
| Column | Type | Note |
| :--- | :--- | :--- |
| **id** | text | Primary Key |
| **buyer_id** | text | Foreign Key to `users` (Buyer) |
| **tier_id** | text | Foreign Key to `tiers` |
| **total_amount** | integer | Total order value |
| **status** | text | `PENDING_APPROVAL`, `APPROVED_BY_TIER`, `REJECTED`, `PROCESSED` |
| **rejection_reason**| text | Reason if the Admin Tier cancels the order |

---

## 3. Workflow Implementation

### A. Authentication Logic
* **Access Control:** No public signup. All users are created by the **SuperAdmin**.
* **Login Method:** Manual login using either `username` or `phone` + `password`.
* **Middleware Protection:** Next.js Middleware will intercept requests. 
    * `BUYER` attempts to access `/admin-tier` or `/superadmin` -> Redirect to `/dashboard/buyer`.
    * Unauthorized users -> Redirect to `/login`.

### B. Dynamic Pricing Engine
When a Buyer fetches the product list, the system filters the price based on their `tier_id`:
```sql
SELECT p.*, tp.price 
FROM products p 
JOIN tier_prices tp ON p.id = tp.product_id 
WHERE tp.tier_id = [Current_User_Tier_ID]