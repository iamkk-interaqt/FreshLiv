# Gwalawala

Gwalawala is a local dairy marketplace connecting customers with local Dairywalas.

## Final product architecture

- Mobile app: Customer + Dairywala experiences for iOS and Android.
- Admin Web Portal: separate private web application; no Admin option in the mobile app.
- Shared backend: Supabase for database, authentication, APIs/business logic, storage and security.
- Single source of truth: mobile clients and Admin Portal use the same backend/database.
- Production rule: no fake/demo marketplace data in production.

## Core flows

Customer: location → Dairywalas → products → cart → address → morning/evening slot → payment → order → delivery → review.

Dairywala: onboarding → verification → activation → products/prices → orders → morning/evening routes → delivery → earnings → settlement.

Admin: private web login → Dairywala/customer/product/area/order/payment/settlement management → verification/approval → reporting/audit.

## Supply onboarding

Admin Direct Add, CSV Import, Customer Referral and Dairywala Self-registration all converge into the same validation → application → verification → approval → active pipeline.

## Delivery

No separate delivery executive. Dairywalas deliver through their own morning/evening slots and local routes/stops.

## Financial architecture

Customer payment → verified transaction → order fulfillment → financial ledger → reconciliation → settlement eligibility → settlement provider/bank processing. Actual bank credit timing depends on the payment/settlement provider and banking rails.

## Build sequence

1. Architecture and data model
2. Supabase backend and security
3. Admin Web Portal
4. React Native + Expo mobile app
5. Real-data onboarding
6. End-to-end testing
7. App Store / Google Play release
