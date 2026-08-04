# unfold weekday outreach (free)

Sends **5 B2B intro emails per weekday ~09:00 UK** to small/medium UK product brands that sell goods (and therefore need packaging).

## How it works

| Piece | Free method |
|---|---|
| Send | [Resend](https://resend.com) (3,000 emails/month free) |
| Schedule | GitHub Actions cron (`0 8 * * 1-5` UTC ≈ 9am BST) |
| Prospects | `outreach/data/prospects-queue.json` (UK SME product brands) |
| Contacts | Public emails on each brand’s own site only (no bought lists) |
| Replies | `Reply-To: hello@unfold.supply` → Outlook notifies you |
| Opt-outs | `outreach/data/suppress.json` |

You do **not** approve each email. You only see replies in Outlook.

## One-time setup (required before anything sends)

### 1. Resend + GoDaddy DNS

1. Sign up at [resend.com](https://resend.com) (free)
2. **Domains → Add** `unfold.supply`
3. Copy the DNS records Resend shows into **GoDaddy → DNS** for `unfold.supply` (SPF / DKIM / optional DMARC)
4. Wait until Resend shows the domain as **Verified**
5. Create an API key

### 2. GitHub secret

Repo → **Settings → Secrets and variables → Actions**:

- Name: `RESEND_API_KEY`
- Value: your Resend API key

### 3. Push + enable Actions

After this code is on `master`, open the **Actions** tab and confirm **Weekday packaging outreach** is listed.

Optional test: **Run workflow** (sends up to 5 real emails).

## Opt-outs

When someone asks to stop, add their email to `outreach/data/suppress.json` and commit (or ask the agent).

## Topping up the queue

When `prospects-queue.json` runs low, add more UK SME product brands (website + company name). Prefer Ltd / brand `.co.uk` shops with physical products — not sole traders on personal Gmail.

## Local commands

```bash
npm run outreach:dry    # resolve contacts + log, no Resend send
npm run outreach:daily  # live send (needs RESEND_API_KEY)
```

## Compliance note

Targets corporate/brand contact addresses published on company websites, identifies unfold, and includes an unsubscribe line. Keep volume at 5/day. This is not legal advice — see [ICO B2B marketing guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/).
