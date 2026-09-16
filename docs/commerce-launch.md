# E-commerce customer journey: delivery and activation

## Public changes

- UK e-commerce positioning and five core product families at `/packaging.html`.
- Product detail pages at `/product.html?pack=mailers` (also postal, book-wraps, crash-lock, tape).
- Guided product-first brief at `/start.html`, including sample preferences, deadline, artwork support and optional file attachments.
- Separate sample, artwork and approach pages. No fabricated customer reviews, production photos, capacity, minimum quantities or delivery guarantees.
- Existing email requests now carry a UF reference in the payload and subject. Confirmed success explains the next step. Failure preserves input. File attachments still use FormSubmit's native upload flow and must be confirmed there.
- Formula price ranges removed from the box brief screen, enquiry text and downloadable PDF.
- Repeat requests from customer order details preserve the previous specification, ask for current quantity and reconfirm price/artwork. Stock reminders are optional downloaded calendar files, not automatic emails.

## Inputs still required from the business

1. Supplier-confirmed product configurations, quantity breaks, setup and tooling, shipping, applicable VAT, validity dates, production capacity and sample costs.
2. A response-time commitment and staff owner who can meet it. No unverified 24-hour claim is published.
3. Approved real sample/customer photography and permissioned reviews. Current illustrations remain labelled.
4. Stripe account for customer-specific hosted invoices, commercial terms, and an agreed process for confirming payment before production.
5. Access to apply the Supabase migration and complete two-customer/one-admin checks. No relevant database MCP or local PostgreSQL runtime was available during implementation.

## Verified pricing

`scripts/buyer-catalog.js` contains an intentionally empty VERIFIED_OFFERS list. Each published offer must have `pack`, `verified:true`, `validUntil` (YYYY-MM-DD), exact `scope`, integer `quantity`, and nonnegative GBP values for `goods`, `setup`, `delivery`, `vat`. The page suppresses expired/incomplete offers. These are reviewed offers for the stated scope, not automatic checkout prices for arbitrary configurations. Use the private quote flow for custom specifications.

## Private quotes and operational queue

Apply `supabase/migrations/20260916_commerce.sql` after the existing base schema. It creates private quotes, an event log, an admin enquiry queue and private immutable proof storage. It also prevents customers changing their own account role through the existing profile-update policy.

Only after access tests pass, set `VITE_COMMERCE_ENABLED=true` in Render's build environment and rebuild. The default is off; `/quotes.html` shows the current email-review route until activated. No secrets belong in any VITE variable.

Admins sign in through the existing portal, then open Quotes & approvals. Log incoming email requests in the work queue with their UF reference and follow-up time. This is a manual inbox-to-queue process; automatic ingestion is not implemented. Create a draft quote for a registered customer using verified costs, quantity, full specification, timing and terms. Attach the final artwork PDF/PNG/JPEG and version if applicable. For an update, create a higher version under the same reference. Review and publish it. Publishing makes it visible in the customer account; it does not email the customer automatically.

Customers can review the full quote and signed proof link, request a change or approve the stated version. Approval runs in a locked database transaction, logs the action and creates a linked order in the existing tracking portal. Expired/superseded versions cannot be approved. Accepted quotes cannot be revised in place.

For payment, create a customer-specific Stripe hosted invoice for the exact amount and include its invoice.stripe.com URL in the draft. After approval, the customer can open that invoice. This is a hosted-invoice handoff, not embedded checkout or a webhook integration. Opening or returning from Stripe never marks an order paid. Staff must confirm the paid invoice in Stripe and update the operational order before releasing production. Do not reuse invoice links between customers.

## Required staging acceptance checks before activation

- With two customer accounts, prove A cannot read B's quote, events, proof, or order through direct API queries, not just the UI.
- Prove anonymous requests cannot access any of these records.
- Prove a customer cannot insert/update quotes, write events, read/update the work queue, or set their own profile role to admin.
- Publish v1, then v2: v1 becomes superseded and cannot be approved. Attempt concurrent publication/approval and verify only a valid latest version succeeds; retry a deadlock if necessary.
- Attempt expired approval, repeated approval and changed quote IDs; verify no duplicate order and no unauthorised acceptance.
- Review and open an attached proof, request changes, publish a revised proof, and confirm version-specific approval/audit history.
- Verify customer-specific Stripe invoice amount, customer and currency in Stripe before sharing; use Stripe test mode for payment testing. Never infer payment from browser navigation.
- Log an enquiry, mark it checking/quoted/closed, and verify due-date ordering with the operator.

## Verification performed in this workspace

Vite build; mocked email success/failure and reference/payload tests; product recommendation and price eligibility tests; reminder calculation tests; desktop/mobile browser checks of public flow; local PDF render. No real enquiry, account registration, payment or database mutation was sent during checks. Backend migration and live payment require the staging checks above and remain unverified until run.
