# WhatsApp-style layout + reach anyone with an account

Goal: anyone with an account can find and message anyone else instantly, in real time, including by phone number — inside a WhatsApp-like layout with a permanent left sidebar.

## 1. Find and message anyone

- Add your phone number to your profile (with country code), editable in Profile and Settings, shown on your profile card.
- Search people by name, username, or phone number from one search field. Typing a number finds that person even if you never met them.
- Tap any result to open a chat immediately — no invitation or approval step.
- A "People" section lists everyone on VIBER UG so new users are never stuck with an empty app.
- Blocking: block someone from the chat menu or their contact card. Blocked people can't message you and you can unblock from Settings > Privacy > Blocked contacts.
- Duplicate numbers are rejected with a clear message so each number points to one account.

## 2. WhatsApp-style left sidebar

A slim vertical rail on the left, always visible on laptops and desktops, in the red theme:

```text
+----+---------------------+------------------------+
| ic |  Chats list         |  Open conversation     |
| ic |  search + filters   |  header, bubbles,      |
| ic |  chat rows          |  emoji, attach, send   |
| .. |                     |                        |
| pf |                     |                        |
+----+---------------------+------------------------+
```

- Rail icons top to bottom: Chats (with unread count), Status, Channels, Communities, GARRY assistant; at the bottom: Settings and your profile photo.
- Middle column: search, filter chips (All, Unread, Favourites, Groups), chat rows with photo, last message, time, unread badge, pinned/muted/archived markers, new-chat button, and a menu (new group, starred messages, select chats, archived).
- Right pane: the open conversation, or a friendly empty state before you pick one.
- On phones it collapses to the familiar single-screen flow with a bottom bar, and the rail reappears as you widen the window.
- Settings opens inside the right pane like WhatsApp, keeping the sidebar visible.

## 3. Real-time behaviour

- New messages, new chats, name and photo changes, online/last-seen and typing all update live for both people without refreshing.
- Sending stays instant: the message appears immediately and reconciles when the server confirms.

## 4. Fix the login flicker

The login screen currently mismatches between first paint and the browser, causing a visible flash. The decorative doodles will be given fixed positions instead of ones that change per render.

## Technical notes

- Migration: `phone` on `profiles` gets a normalised unique index (E.164) plus a `blocked_contacts` table (blocker_id, blocked_id, created_at) with GRANTs and RLS — a user reads/writes only their own block rows.
- Message and participant policies gain a block check so blocked pairs cannot insert messages into each other's direct chats; `searchProfiles` filters out people who blocked you.
- New `src/routes/_authenticated/route.tsx` sibling layout component `AppShell` (rail + list + `<Outlet />`), used by `chats`, `chat.$chatId`, `settings`, `profile`; each keeps its own `head()` meta.
- Realtime: consolidate into one subscription per signed-in user in the shell (messages, conversations, conversation_participants, profiles) and share via context, instead of per-page channels.
- Doodle positions move to a static seeded array rendered identically on server and client.
- Status, Channels and Communities rail entries land as navigable placeholder screens in this pass; their full features stay in later releases of the approved roadmap.
