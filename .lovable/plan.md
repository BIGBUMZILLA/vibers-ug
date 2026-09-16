# VIBER UG: complete red messenger roadmap

## Goal
Turn the current Rouge prototype into **VIBER UG**, a polished red WhatsApp-style messenger that works responsively across phones, tablets, and desktops, adds the cat-based GARRY assistant, and keeps each user’s account, settings, conversations, and AI history synchronized.

The current app already has secure accounts, persistent login sessions, direct/group chats, live text and photo updates, reactions, unread counts, profiles, presence, and private media. This plan expands those foundations rather than rebuilding them.

## Release 1 — identity, appearance, and navigation
- Rename visible branding to **VIBER UG** and place **VIBER UG** in bold red above the login cat.
- Create one reusable cat brand asset based on the login identity; use it for the larger animated login badge, GARRY’s avatar, and a properly resized browser favicon. Remove the old Lovable favicon.
- Enlarge the cat and red circle slightly, with gentle float, ear/face motion, and reduced-motion support.
- Replace the current orderly login decoration with very small, low-contrast communication doodles scattered at intentionally irregular positions. Keep forms readable and uncluttered.
- Make the global light/dark choice apply to every public and signed-in page, persist after refresh and login, and expose the same appearance control in the main menu/settings.
- Replace isolated mobile-width pages with one adaptive WhatsApp-inspired shell: conversation rail on wide screens, focused single-pane navigation on small screens, red headers/actions, and consistent search/menu behavior.
- Add a settings area for profile, appearance, account, privacy, notifications, chats, storage, help, and sign-out.
- Finish profile editing for photo, display name, username, about/status, and account details with clear validation.

## Release 2 — complete messaging core
- Improve live delivery so new messages, reactions, typing, presence, read state, edits, and deletions update without repeatedly reloading the full conversation.
- Add message lifecycle states: sending, sent, delivered, read, failed, edited, and deleted.
- Add replies, forwarding, starred messages, copy, multi-select, delete-for-me/delete-for-everyone, richer reactions, links, timestamps, date separators, and conversation search.
- Expand attachments to photos, videos, documents, audio, camera capture where supported, captions, previews, downloads, and upload progress.
- Add voice-note recording and playback with duration, seek/progress, cancel, and permission/error states.
- Add typing indicators, online/last-seen privacy, read-receipt privacy, blocked users, archived chats, pinned chats, muted chats, notification preferences, disappearing-message timers, and chat wallpaper settings.
- Complete group tools: group image/info, participant list, add/remove members, admins, invite links, permissions, leave group, and system-event messages.
- Add safe in-app and browser notifications with permission controls.

## Release 3 — statuses and social communication
- Add 24-hour photo/video/text statuses with viewers, replies, privacy audiences, mute, and expiry cleanup.
- Add broadcasts, polls, contact sharing, and supported location sharing.
- Add communities and announcement groups, followed by channels only after the core moderation and privacy rules are established.

## Release 4 — GARRY, the cat assistant
- Add **multiple named GARRY conversations**, each with its own dedicated URL and database-backed history that follows the signed-in user across devices.
- Present GARRY as a special animated cat contact derived from the login brand mark, available from the main navigation and new-chat flow.
- Build the transcript and composer using the supported AI chat building blocks, including streamed markdown replies, visible thinking state, stop control, retry/copy actions, and collapsed tool activity.
- Stream responses securely through Lovable AI using `openai/gpt-6-astra`; keep the complete conversation context server-side and never expose credentials in the browser.
- Persist completed user and assistant messages to the active GARRY thread, surface saving and AI-credit errors clearly, and prevent messages from mixing between threads.
- Give GARRY messaging-focused assistance first: drafting replies, summarizing pasted text, translation, planning, and general questions. Any future action that sends, deletes, or changes user data must require explicit approval.

## Release 5 — calls and advanced WhatsApp parity
- Add one-to-one voice and video calling with ringing, accept/decline, mute, camera switch, speaker/device controls, call history, reconnect states, and permissions handling.
- Then add group calls, screen sharing where supported, picture-in-picture, low-bandwidth behavior, and call links.
- Calls require WebRTC signaling plus a production TURN service; this stage will include provider setup and real-device/network testing before it is marked complete.
- Add multi-device session management, linked-device visibility, export/delete-account flows, advanced privacy controls, and storage management.

## Platform delivery
- Make the product a responsive, installable web app that works in modern mobile and desktop browsers, with touch targets, safe-area support, offline shell behavior, and install metadata.
- Verify the key flows at phone, tablet, and desktop sizes. Native App Store/Play Store binaries require a separate packaging/release track outside this web project, but the same responsive app can be prepared for that wrapper later.

## Data and security
- Extend the existing protected data model for message delivery state, attachments, typing, blocks, chat preferences, group administration, statuses, calls, notifications, and GARRY threads/messages.
- Keep every user-owned row and private file access-controlled; verify membership before reads/writes and ownership before edits/deletes.
- Keep roles separate from user profiles if moderation roles are introduced.
- Preserve account sessions so returning users only need valid credentials when their secure session expires or they sign out.
- Add validation, upload limits, media type checks, abuse/rate controls, and account/privacy deletion behavior.

## Validation by release
- Test two real accounts exchanging messages live in both directions, including offline/reconnect, delivery/read states, media, typing, edits, deletions, groups, blocking, and refresh persistence.
- Verify theme persistence and every major screen in both light and dark modes.
- Verify login, signup/confirmation, logout, session restoration, profile editing, username uniqueness, and private media access.
- For GARRY, create two threads, message in each, reload both dedicated URLs, and confirm histories remain isolated and synchronized.
- Test every Lovable AI request and surface exact credit, policy, rate-limit, and service errors without silent retries.
- Test accessibility, reduced motion, keyboard use, text fitting, and phone/tablet/desktop layouts before each release closes.

## Delivery order
Implementation will proceed release by release. The first implementation milestone will deliver the global theme, VIBER UG/cat identity, randomized doodles, favicon, adaptive WhatsApp-style shell, settings, and profile polish. Messaging expansion follows once that shared foundation is stable.
