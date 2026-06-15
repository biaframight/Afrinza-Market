---
name: Afrinza room listings approval flow
description: How room listings work end-to-end — creation, ownership, approval, and admin management.
---

## The rule
New room listings default to `is_active = FALSE` (pending). Admin must approve them in the admin panel Rooms tab before they appear publicly.

**Why:** Marketplace quality control — prevent spam/inappropriate listings going live immediately.

**How to apply:** Any new `createRoomListing` call sets `is_active: false` by default (handled in supabase-db.ts). The admin Rooms tab has Approve/Deactivate toggle.

## Key migration
`supabase/migrations/012_rooms_admin.sql` — adds `user_id` column, flips `is_active` default to FALSE, and adds RLS policies for owner read/update/delete and admin full access. Must be run manually in Supabase SQL Editor.

## Ownership & backward compat
`getMyRoomListings(userId, whatsapp?)` — queries `user_id = userId` first; also fetches old rows where `user_id IS NULL AND whatsapp = ?` for backward compatibility with rooms created before the migration.

## Admin panel
- Route: `/admin` (guarded by `ADMIN_EMAIL = "alphuplift@gmail.com"`)
- Rooms tab: filter All/Pending/Live, approve/deactivate toggle, edit dialog (title, type, price, location, available-from), delete with confirm.
- Hooks: `useAdminGetAllRoomListings`, `useAdminApproveRoomListing`, `useAdminUpdateRoomListing`, `useAdminDeleteRoomListing`.

## Dashboard
- Uses `useGetMyRoomListings(user?.id, whatsapp?)` — shows user's own rooms (including inactive).
- Status badge: green "Live" or amber "Pending Approval" on each room card.
