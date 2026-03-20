# Connector Onboarding

This document lists external steps that cannot be automated from the codebase.

## ABN AMRO
1. Register app in ABN developer portal.
2. Request AIS scopes for transaction and balance access.
3. Add redirect URL: `https://<your-domain>/api/connect/callback`.
4. Configure:
   - `ABN_AMRO_CLIENT_ID`
   - `ABN_AMRO_CLIENT_SECRET`
   - `ABN_AMRO_AUTH_URL`
   - `ABN_AMRO_TOKEN_URL`
   - `ABN_AMRO_API_BASE_URL`

## ICS
1. Obtain ICS API contract + client credentials.
2. Confirm OAuth endpoints and API base endpoint with ICS.
3. Add redirect URL: `https://<your-domain>/api/connect/callback`.
4. Configure:
   - `ICS_CLIENT_ID`
   - `ICS_CLIENT_SECRET`
   - `ICS_AUTH_URL`
   - `ICS_TOKEN_URL`
   - `ICS_API_BASE_URL`

## PayPal
1. Create live app in PayPal developer dashboard.
2. Add redirect URL: `https://<your-domain>/api/connect/callback`.
3. Configure:
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `PAYPAL_AUTH_URL`
   - `PAYPAL_TOKEN_URL`
   - `PAYPAL_API_BASE_URL`

## Bitvavo
1. Create API key and secret with read permissions.
2. Configure:
   - `BITVAVO_API_KEY`
   - `BITVAVO_API_SECRET`
   - `BITVAVO_API_BASE_URL`

## Final verification
1. Run `npm run setup:check`.
2. Open Settings page and verify core + provider readiness.
3. Connect accounts in Accounts page.
4. Run first manual `Sync now` for each account.
