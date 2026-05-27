# Security Specification & Threat Model - Polla Mundialista 2026

This document presents the security, confidentiality, and data integrity boundaries enforced at the Firestore safety boundary.

## 1. Data Invariants
- **Identity Integrity**: A user can only create or edit profiles, forecasts, and league memberships linked to their authenticated `auth.uid`.
- **Match Status Invariant**: Forecasts can only be placed/edited for matches that are in the `scheduled` state. Once a match is `live` or `finished`, forecasts are immutable.
- **Strict Playlists**: Users cannot modify actual Match entities (stadium, teams, statuses, scores) — only designated Admins are authorized.
- **Immutable Timestamps**: Match updates, user sign-ups, and forecasts must use high-fidelity write times synced with `request.time`.

## 2. The "Dirty Dozen" Attack Vectors
These represent high-threat payloads that are strictly rejected by the rules boundary:
1. **Unauthenticated Write**: An anonymous user attempts to set a match score.
2. **Identity Theft (Spoofing)**: User `A` tries to submit or modify is forecast under User `B`'s identity.
3. **Privilege Escalation**: User `A` tries to update their profile flag to `isAdmin: true`.
4. **Match Poisoning**: A general user attempts to set matching scores inside the `/matches` collection.
5. **Score Injection (After the fact)**: User tries to submit a forecast for a match that is already `live` or `finished`.
6. **League Takeover**: User `A` tries to delete or rename a League they did not create.
7. **Junk ID Poisoning**: Trying to write a document ID containing special injected symbols or sizes greater than 128 characters.
8. **Shadow Field Injection**: Saving an extra unauthorized field (e.g. `isVerified: true`) during sign-up to bypass fields validation.
9. **PII Leakage**: Trying to scan all users' private details or emails without ownership.
10. **System Overwrite limit**: Unconstrained list sizes or nested structures in documents causing memory hog.
11. **Future Timestamp Spoofing**: Users injecting a pre-dated `updatedAt` field on predictions to sneak past lockout controls.
12. **Out-of-Order Transition**: Moving a match status from `finished` back to `scheduled` to reactivate forecasting.

## 3. Rules Implementation Strategy
Enforced via helper functions and actions:
- `isValidId()` for path and ID hardening.
- `isValidUserProfile()`, `isValidMatch()`, `isValidForecast()`, `isValidLeague()`.
- Explicit `incoming().diff(existing()).affectedKeys().hasOnly(...)` during updates.
- Double validation of user matching in `allow list` targets to prevent unrestricted listing.
