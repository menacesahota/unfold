/**
 * Weekday outreach — 5 UK SME product brands/day via Resend.
 *
 * Prospects come from outreach/data/prospects-queue.json (UK product brands).
 * Contact emails are taken only from public pages on each brand's own site.
 *
 * Usage:
 *   node outreach/send-daily.mjs --dry-run
 *   RESEND_API_KEY=re_xxx node outreach/send-daily.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "data");
const QUEUE_FILE = path.join(DATA, "prospects-queue.json");
const SUPPRESS_FILE = path.join(DATA, "suppress.json");
const SENT_FILE = path.join(DATA, "sent.jsonl");

const DAILY_LIMIT = 5;
const FROM = "unfold <hello@unfold.supply>";
const REPLY_TO = "hello@unfold.supply";
const SITE = "https://unfold.supply";

const CONSUMER_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "yahoo.com",
  "yahoo.co.uk",
  "icloud.com",
  "me.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "btinternet.com",
  "sky.com",
  "virginmedia.com",
]);

const EMAIL_RE =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const dryRun = process.argv.includes("--dry-run");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function loadSent() {
  const emails = new Set();
  const domains = new Set();
  if (!fs.existsSync(SENT_FILE)) return { emails, domains };
  for (const line of fs.readFileSync(SENT_FILE, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row.dryRun || row.error) continue;
      if (row.email) emails.add(String(row.email).toLowerCase());
      if (row.domain) domains.add(String(row.domain).toLowerCase());
    } catch {
      /* ignore */
    }
  }
  return { emails, domains };
}

function appendSent(row) {
  fs.appendFileSync(SENT_FILE, `${JSON.stringify(row)}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function domainOf(email) {
  return String(email).split("@")[1]?.toLowerCase() || "";
}

function rootHost(website) {
  try {
    return new URL(website).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isBusinessEmail(email) {
  const d = domainOf(email);
  if (!d || CONSUMER_DOMAINS.has(d)) return false;
  if (d.endsWith(".gov.uk") || d.endsWith(".ac.uk")) return false;
  if (email.includes("example.com") || email.includes("sentry.io")) return false;
  if (email.includes("wixpress") || email.includes("domain.com")) return false;
  if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(email)) return false;
  return true;
}

function extractEmails(html) {
  const found = html.match(EMAIL_RE) || [];
  return [...new Set(found.map((e) => e.toLowerCase()))].filter(isBusinessEmail);
}

function scoreEmail(email) {
  const local = email.split("@")[0];
  if (["hello", "info", "enquiries", "enquiry"].includes(local)) return 0;
  if (["contact", "sales", "team", "hello"].includes(local)) return 1;
  if (local.includes("noreply") || local.includes("no-reply")) return 99;
  return 5;
}

function preferredEmail(emails, host) {
  const same = emails.filter((e) => {
    const d = domainOf(e);
    return d === host || host.endsWith(d) || d.endsWith(host);
  });
  const pool = (same.length ? same : emails).slice();
  pool.sort((a, b) => scoreEmail(a) - scoreEmail(b));
  return pool[0] || null;
}

async function fetchText(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "unfold-outreach/1.0 (+https://unfold.supply; UK B2B packaging intros)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text") && !ct.includes("html") && !ct.includes("xml")) {
      return null;
    }
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function resolveContact(entry, sent) {
  const host = rootHost(entry.website);
  if (!host) return null;
  if (sent.domains.has(host)) return null;

  let origin;
  try {
    origin = new URL(entry.website).origin;
  } catch {
    return null;
  }

  const paths = [
    "/",
    "/contact",
    "/contact-us",
    "/pages/contact",
    "/pages/contact-us",
    "/about",
    "/about-us",
    "/pages/about",
    "/pages/contact-us",
    "/en/contact",
  ];

  const emails = [];
  for (const p of paths) {
    const html = await fetchText(`${origin}${p}`);
    if (!html) continue;
    emails.push(...extractEmails(html));
    await sleep(350);
  }

  const unique = [...new Set(emails)];
  const email = preferredEmail(unique, host);
  if (!email) return null;
  if (sent.emails.has(email)) return null;

  return {
    email,
    company: entry.company || host,
    website: origin,
    domain: host,
    category: entry.category || null,
  };
}

function buildMessage(prospect) {
  const subject = `Are you paying too much for packaging? — free quote from unfold`;
  const text = `Hello ${prospect.company} team,

Quick question from unfold (UK): are you paying too much for your packaging?

We source packaging suppliers, negotiate pricing, and quote you for free. If the price works, you order through us — boxes, mailers, bags, pouches, food packaging and more.

Get a free quote: ${SITE}

Reply to this email if useful, or tell us to stop and we won’t contact you again.

Kind regards,
unfold
${SITE}
hello@unfold.supply

To unsubscribe: reply with “unsubscribe” or email hello@unfold.supply with subject Unsubscribe.`;

  return { subject, text };
}

async function sendResend({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      reply_to: REPLY_TO,
      subject,
      text,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  const suppress = new Set(
    readJson(SUPPRESS_FILE, []).map((e) => String(e).toLowerCase())
  );
  const sent = loadSent();
  let queue = readJson(QUEUE_FILE, []).filter((x) => x && x.website);

  console.log(
    `Outreach start · limit=${DAILY_LIMIT} · dryRun=${dryRun} · queue=${queue.length} · suppressed=${suppress.size}`
  );

  const remaining = [];
  const ready = [];

  for (const entry of queue) {
    if (ready.length >= DAILY_LIMIT) {
      remaining.push(entry);
      continue;
    }
    const host = rootHost(entry.website);
    if (sent.domains.has(host)) {
      console.log(`Skip already-sent domain: ${host}`);
      continue;
    }

    console.log(`Resolve contact: ${entry.company} (${entry.website})`);
    const prospect = await resolveContact(entry, sent);
    if (!prospect || suppress.has(prospect.email)) {
      console.log(`  no usable public business email — leaving in queue for retry`);
      remaining.push(entry);
      continue;
    }

    ready.push({ ...prospect, queueEntry: entry });
    console.log(`  → ${prospect.email}`);
  }

  if (!ready.length) {
    console.log("No sendable prospects today. Top up prospects-queue.json.");
    process.exit(0);
  }

  const putBack = [];

  for (const p of ready) {
    const { subject, text } = buildMessage(p);
    const row = {
      at: new Date().toISOString(),
      email: p.email,
      company: p.company,
      website: p.website,
      domain: p.domain,
      category: p.category,
      subject,
      dryRun,
    };

    if (dryRun) {
      console.log(`[dry-run] would send → ${p.email} (${p.company})`);
      putBack.push(p.queueEntry);
      continue;
    }

    try {
      const result = await sendResend({ to: p.email, subject, text });
      row.id = result.id || null;
      appendSent(row);
      console.log(`Sent → ${p.email} (${p.company}) id=${row.id || "?"}`);
      await sleep(1200);
    } catch (err) {
      console.error(`Failed → ${p.email}: ${err.message}`);
      row.error = err.message;
      appendSent(row);
      putBack.push(p.queueEntry);
    }
  }

  if (!dryRun) {
    writeJson(QUEUE_FILE, [...putBack, ...remaining]);
  }

  console.log(
    `Done. Queue remaining: ${dryRun ? queue.length : putBack.length + remaining.length}${dryRun ? " (unchanged — dry run)" : ""}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
