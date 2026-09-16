# Buyer journey rollout

Implemented: compact offer-led homepage, three buying guides, sample/quantity/delivery guidance, optional quote details, help-me-choose route, illustrative box brief and transparent estimate exclusions.

## Evidence still needed

Do not label generated packshots as customer work. Add approved real samples with dimensions, board specification, print finish and permission to publish. Reviews/case studies need approved attribution and verifiable outcomes. Supplier-backed quantity and delivery ranges need dated evidence; the old calculator MOQ is not evidence of availability.

## Analytics activation

Set `VITE_GA_MEASUREMENT_ID=G-...` in Render's build environment and redeploy. No analytics provider was configured at implementation time. Until configured, events are emitted as `unfold:analytics` document events for development but are NOT collected centrally.

The optional GA4 adapter loads only after opt-in. Visitors can change their choice through Analytics preferences in the footer. In GA4 disable Enhanced Measurement (especially form interactions/history changes); use the deliberately limited custom events. Do not enable user-provided data collection. Update the site's privacy information for the configured service before activation.

Events: product_select, quote_start, quote_submit_attempt, quote_submit_success, quote_submit_error, quote_attachment_handoff, spec_download, spec_to_quote, guide_quote_click, page_view.

Only page path, fixed product IDs and four-digit style codes are included. No names, emails, addresses, file names, free text or URL queries are passed. Events before opt-in are not replayed.

quote_submit_success requires an affirmative AJAX service response. Attachments use the existing external FormSubmit flow; a handoff is not a confirmed success. The return URL alone cannot prove delivery. Server-confirmed attachment completion needs a provider callback/backend integration.

## Checks

Check phone/desktop layouts, guide-to-quote category selection, Help me choose, optional details, invalid email, failed/activation responses preserving answers, PDF exclusions, style preselection and spec-to-quote handoff. Do not send live test enquiries; mock the service when testing submissions.
