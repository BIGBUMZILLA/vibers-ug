# One-time email verification for new accounts

Goal: when someone creates an account, VIBER UG emails them a one-time confirmation link. They can only sign in after clicking it.

## What the user will see

1. Fill in name, email and password, tap "Create account".
2. A confirmation screen: "We sent a one-time link to <email>. Open it to activate your account." with a "Resend link" button (60-second cooldown) and a "Use a different email" link.
3. Clicking the link in the inbox returns them to VIBER UG, signs them in and drops them into Chats.
4. If they try to sign in before confirming, they get a clear message: "Confirm your email first — check your inbox" plus a resend button, instead of a raw error.

## Work to do

- Keep email confirmation required (no auto-confirm) and turn on the leaked-password check.
- Sign-up already sends the link; add the resend action, cooldown, change-email option and the unconfirmed sign-in message on the login screen.
- Add a small landing step so the link returns into the app and lands on Chats once the session is live.

## Finish the current layout work (already in progress)

- Status, Channels, Communities and GARRY screens were just created so the app builds again.
- Move Chats, the conversation view, Settings and Profile into the WhatsApp-style shell (icon rail + list column + open pane).
- Add the phone number field to Profile so people can be found by number.

## Security fix included

People search no longer reads the profiles table directly: phone numbers are now private, and a dedicated search returns only name, username, photo, about and last-seen. The people-search code will be switched over to it in this change.

## Technical notes

- `supabase--configure_auth`: `auto_confirm_email: false`, `password_hibp_enabled: true`, `disable_signup: false`, `external_anonymous_users_enabled: false`.
- `signUp` keeps `emailRedirectTo: window.location.origin`; resend uses `supabase.auth.resend({ type: "signup", email })`.
- Sign-in error mapped on `error.code === "email_not_confirmed"`.
- `searchProfiles` in `src/lib/chat.ts` switches to `supabase.rpc("search_profiles", { _term })`, keeping the local block filter.
- Branded confirmation emails (custom sender domain) are a separate follow-up; default Lovable emails are used for now.
