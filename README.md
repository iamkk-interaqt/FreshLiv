# FreshLiv

FreshLiv is a local fresh-food marketplace connecting customers with local businesses.

**Fresh • Local • Everyday**  
**Your Local Fresh Food Market**

## Categories

- Dairy
- Chicken
- Mutton
- Fish
- Eggs

## Architecture

- Mobile app: Customer + Seller/Business experiences for iOS and Android.
- Admin Web Portal: separate private web application; no Admin option in the mobile app.
- Shared backend: Supabase for database, authentication, APIs/business logic, storage and security.
- Single source of truth: mobile clients and Admin Portal use the same backend/database.
- Production rule: no fake/demo marketplace data in production.

## Important migration rule

This repository is being migrated from the Gwalawala brand to FreshLiv without rebuilding the marketplace backend. Existing Supabase tables, order/payment architecture, authentication, settlement logic, notifications and EAS package identity are preserved unless a later release explicitly changes them.

The Android package and iOS bundle identifier remain unchanged during this migration to avoid accidentally creating a new store application identity before the launch strategy is finalized.

## Core marketplace flow

Customer: location → category → product → type/cut/variant → usage → available local sellers → product → cart → payment → order → fulfillment → tracking/review.

Seller/Business: onboarding → verification → activation → products/prices → orders → fulfillment → earnings → settlement.

Admin: private web login → business/customer/product/order/payment/settlement management → verification/approval → reporting/audit.

## Supply onboarding

Admin Direct Add, CSV Import, Customer Referral and Seller/Business Self-registration converge into the same validation → application → verification → approval → active pipeline.

## Financial architecture

Customer payment → verified transaction → order fulfillment → financial ledger → reconciliation → settlement eligibility → settlement provider/bank processing.
