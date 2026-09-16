# Gwalawala mobile authentication release checklist

## Client configuration

The Expo app uses:

- `EXPO_PUBLIC_SUPABASE_URL=https://gjgitabtalnnirelbual.supabase.co`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<EAS environment value>`

Only the publishable/anon client key belongs in the mobile app. Never put a Supabase service-role key, Cashfree secret, or SMS-provider secret in the APK.

## Native session

`src/lib/supabase.ts` is the single Supabase client. Native authentication sessions are persisted with AsyncStorage, automatically refreshed, and restored when the app starts.

`src/auth/AuthProvider.tsx` restores the session once at the root and listens for `onAuthStateChange` events. Screens should use the same Supabase client rather than creating a second client.

## OTP flow

Customer and Dairywala use:

1. Normalize Indian phone number to `+91XXXXXXXXXX`.
2. `supabase.auth.signInWithOtp({ phone })`.
3. Receive the real SMS OTP from the configured Supabase SMS provider.
4. `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`.
5. Confirm `supabase.auth.getSession()` returns a real session before navigating to a protected screen.

No fake OTP or authentication bypass is permitted.

## CAPTCHA / widget error

If Supabase CAPTCHA protection is enabled under Authentication > Bot and Abuse Protection, the frontend must provide a valid CAPTCHA token. Supabase supports hCaptcha and Cloudflare Turnstile. A native Expo screen must not display a broken web CAPTCHA widget.

For the current Gwalawala native SMS flow, if CAPTCHA protection is not intentionally required, disable it in the Supabase Dashboard before release. If it is required, implement a production-compatible native/web challenge and pass its token to the relevant Auth request.

## EAS

Set the following variables in EAS for development, preview, and production:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not rely on a local `.env.local` being present in an EAS build.

## APK verification

After environment variables are configured:

```bash
npx expo config --type public
npx expo start --clear
npx eas build --profile preview --platform android
```

For the release build:

```bash
npx eas build --profile production --platform android
```

Test on the actual APK:

- Customer Send OTP
- Customer Verify OTP
- Dairywala Send OTP
- Dairywala Verify OTP
- session survives navigation
- session survives app restart
- protected pages do not report a false auth-missing state
- sign out removes the session

A source-code change is not considered release-verified until the resulting APK has been tested with the production Supabase project.
