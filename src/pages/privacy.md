---
title: 'Privacy Policy — ReplyOmat'
description: 'How ReplyOmat.ai collects, uses, and protects your data, including Google user data accessed through the Google Business Profile APIs.'
path: /privacy
layout: ../layouts/LegalLayout.astro
---

# ReplyOmat.ai Privacy Policy

<p class="legal-meta"><strong>Effective date:</strong> 15 July 2026<br />
<strong>Last updated:</strong> 15 July 2026<br />
<strong>Version:</strong> 1.0</p>

## 1. Who we are

ReplyOmat.ai ("ReplyOmat", "we", "us", or "our") is operated by:

| Detail | Value |
|---|---|
| Operator (data controller) | Jan Phillip Winter, sole trader, trading as ReplyOmat |
| Registered address | Rua do Monte dos Judeus 74, apt. B, 4050-411 Porto, Portugal |
| Company registration | Operating as an individual sole trader; no company registration number applicable |
| Privacy contact | jan@replyomat.ai |
| Data Protection Officer | No formal DPO is designated. Our processing does not, on its scale and nature, require a DPO under Article 37 GDPR. Privacy enquiries go to the contact above. |
| Governing law | Laws of the Portuguese Republic and the EU General Data Protection Regulation (GDPR) |
| Supervisory authority | Comissão Nacional de Proteção de Dados (CNPD), www.cnpd.pt |

ReplyOmat.ai is the data controller for the personal data described in this policy.

ReplyOmat.ai is a software-as-a-service platform that helps verified business owners and their
authorized managers read and respond to customer reviews on their Google Business Profile.
ReplyOmat connects to your Google Account through Google OAuth 2.0 and accesses your review
data through the Google Business Profile APIs.

ReplyOmat.ai is not affiliated with, endorsed by, or sponsored by Google LLC. Google, Google
Business Profile, and the Google logo are trademarks of Google LLC.

## 2. Scope of this policy

This policy applies to business owners, authorized managers, and team members who register for
and use ReplyOmat.ai; to all personal data and Google user data processed through the service;
and to interactions with our website and application.

## 3. Google API Services and Google user data

This section describes how ReplyOmat.ai accesses, uses, stores, and shares Google user data. It
is written to meet the disclosure requirements of Google's OAuth verification and the Google API
Services User Data Policy.

### 3.1 How we connect to your Google Account

ReplyOmat.ai uses Google OAuth 2.0 to connect to your Google Account and Google Business
Profile. When you connect, Google presents a consent screen where you review and grant or deny
the specific permission ReplyOmat requests. You control this authorization at all times.

Because ReplyOmat needs to fetch reviews and post approved replies on your behalf without asking
you to sign in again every hour, the connection uses offline access, which issues a refresh
token. See section 3.6 for how we store and protect that token.

You must be a verified owner or authorized manager of the Google Business Profile location(s) you
manage through ReplyOmat.ai. ReplyOmat only accesses data for locations in your authorized Google
Business Profile account.

### 3.2 OAuth scope we request

| OAuth scope | Purpose |
|---|---|
| `https://www.googleapis.com/auth/business.manage` | Read your Google Business Profile reviews and post reply text that you have approved |
| `openid`, `email`, `profile` | Identify the Google Account signing in, for authentication only |

We request only the minimum scope necessary to provide the service. We do not request access to
any Google product or data beyond the above.

### 3.3 Google APIs we use

ReplyOmat.ai accesses Google user data through the **Google Business Profile APIs**, specifically
the review management endpoints (listing reviews for your authorized locations and posting reply
text to those reviews). Review data is accessed through the `accounts.locations.reviews` endpoints
of the Google My Business API v4, which remain the endpoints Google serves review data from.
We do not use any other Google API to access your account data.

### 3.4 What Google user data we access

**Account identification data**

- Your Google Account email address, used to identify you as the authenticated user.
- Your Google Account identifier (`sub`), used internally to link your ReplyOmat account to your
  Google Account.
- We do not access your password, payment methods, search history, Gmail, Google Drive, Google
  Calendar, or any other Google service.

**Google Business Profile data (fetched live, not stored)**

- Business and location details: business name, address, location identifier(s), and category.
- Reviews: review text, star rating, reviewer display name as provided by Google, review date,
  review media where provided, any existing reply, and reply status.

Review data is retrieved from the Google Business Profile APIs on demand and displayed in your
authenticated session. It is not written to a ReplyOmat database. See section 3.6.

### 3.5 How we use Google Business Profile data

ReplyOmat.ai uses Google Business Profile data only to provide the following user-facing features:

- **Read and display reviews.** We fetch your reviews live through the API and show them in your
  ReplyOmat dashboard so you can see them in one place. Review content is visible only to you and
  to authorized members of your own ReplyOmat account.
- **AI-assisted reply suggestions.** If you use the AI reply feature, ReplyOmat sends the relevant
  review text (reviewer display name, star rating, review content, and the business context you
  configure) to our AI provider to generate a suggested reply. The provider is OpenAI (see
  section 6). Suggestions are shown to you for review and editing.
- **Post replies you have approved.** ReplyOmat posts a reply to a review through the Google
  Business Profile API only after you have reviewed the suggested text and explicitly clicked to
  publish it. We do not post, alter, or delete any reply without your instruction. Automated or
  scheduled posting without per-reply approval is not offered.

### 3.6 What we store, and what we do not

- **Review content: not stored.** ReplyOmat fetches your reviews from Google on demand and holds
  them only transiently in memory to render your session and to generate a suggested reply. We do
  not persist review text, reviewer names, ratings, or related review metadata in our database.
- **AI-generated suggestions: not stored.** Suggested reply text is generated in-session and is
  not persisted after you approve, discard, or leave the session. Once you approve and post a
  reply, it lives on your Google Business Profile, not in a ReplyOmat database.
- **OAuth tokens: stored, encrypted.** To fetch reviews and post approved replies on your behalf,
  we store your OAuth refresh token encrypted at rest. Access tokens are short-lived and are not
  retained beyond their expiry. Tokens are never written to logs or exposed in the interface.
- **Account and settings data: stored.** See section 4.

### 3.7 Limited Use disclosure

ReplyOmat.ai's use and transfer of information received from Google APIs to any other application
will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements. Specifically:

- We do not sell, rent, or transfer Google user data for monetary or other consideration.
- We do not use Google user data for advertising, retargeting, or building advertising profiles.
- We do not use Google user data to determine creditworthiness or for lending or insurance.
- Google user data is used solely to provide and improve the user-facing ReplyOmat features
  described in this policy, and for no unrelated purpose.
- We do not use Google user data to train, develop, or improve generalized AI or machine learning
  models. Review text sent to our AI provider is used only to generate your reply suggestion (see
  section 6).
- Human access to Google user data is restricted to the limited circumstances in section 11.

## 4. Other data we collect

**Account registration data**

- Name and, where provided, job title of the person registering.
- Business email address and business name.
- Your Google Account email and identifier (`sub`) from the OAuth sign-in.

**Configuration data**

- Tone, brand-voice, language, and reply preferences you configure.

**Usage and technical data**

- Sign-in and authentication events, including timestamps and IP address.
- Application interaction events, error logs, and audit logs.
- Device type, operating system, and browser type and version.
- Approximate geographic location at country or city level, derived from IP address.

**Billing data**

- None. ReplyOmat.ai does not currently collect payments or store payment data. If paid plans are
  introduced, this policy will be updated before any billing data is collected.

## 5. Legal bases for processing (GDPR)

| Legal basis | Processing activity |
|---|---|
| Performance of a contract, Article 6(1)(b) | Providing the service: connecting to your Google Account, fetching and displaying reviews, generating reply suggestions, and posting the replies you approve. |
| Legitimate interests, Article 6(1)(f) | Security monitoring, abuse and fraud prevention, debugging, audit logging, and service improvement, where not overridden by your rights. |
| Legal obligation, Article 6(1)(c) | Compliance with applicable law, legal process, and regulatory requirements. |
| Consent, Article 6(1)(a) | Any optional analytics or marketing communications. You may withdraw consent at any time without affecting prior processing. |

## 6. AI processing and our AI provider

When you use the AI reply feature, review text and the business context you configure are
transmitted over an encrypted connection to our AI provider, which acts as a data processor on our
behalf:

| Detail | Value |
|---|---|
| AI provider | OpenAI Ireland Ltd (Ireland), the OpenAI contracting entity for EEA customers, with processing performed by OpenAI OpCo, LLC (United States) as its affiliate |
| Model | GPT-4o-mini |
| Use of your data for training | OpenAI does not train its models on data submitted through its API by default. We do not permit training on submitted review content. |
| Data Processing Agreement | Executed via DocuSign in 2026 with OpenAI Ireland Ltd. It supplements the OpenAI Services Agreement and includes the Standard Contractual Clauses covering any processing in the United States. |

We do not use review content for any purpose other than generating your reply suggestion.

## 7. Data retention and deletion

We retain personal data only as long as necessary for the purposes in this policy.

| Data category | Retention |
|---|---|
| Google Business Profile review content | Not stored. Fetched live and held only for the duration of your session. |
| AI-generated reply suggestions | Not stored. Held only for the duration of your session. |
| OAuth refresh token | Retained for the life of your active Google connection; deleted on disconnection or account deletion. |
| Account and configuration data | For the life of your account, then deleted within 30 days of account closure. |
| Usage and technical logs | Up to 12 months, for security, debugging, and audit. |
| Backups | Encrypted backups are deleted after 7 days. |

To request deletion, contact jan@replyomat.ai. We action verified deletion requests within 30
days, except where retention is required by law.

## 8. Revoking Google access

You can revoke ReplyOmat's access at any time.

- **Through Google:** visit https://myaccount.google.com/permissions, find ReplyOmat.ai, and
  remove access. This immediately invalidates our tokens.
- **Through ReplyOmat:** email jan@replyomat.ai to disconnect and delete your stored token.

After revocation, ReplyOmat can no longer fetch reviews or post replies. Because we do not store
review content, there is no review data to delete; to delete your account and configuration data,
request account deletion (section 7).

## 9. Third-party service providers

We use a small number of processors under contractual data-protection obligations:

| Provider type | Details |
|---|---|
| Hosting and infrastructure | Self-hosted infrastructure located in Portugal (EU). |
| Network and connectivity | Cloudflare, Inc. (United States), providing secure tunnel and content delivery, under Cloudflare's Data Processing Addendum, which is incorporated by reference into Cloudflare's self-serve terms and applies automatically to the account (it also includes the Standard Contractual Clauses for the US transfer). |
| AI model provider | OpenAI Ireland Ltd (Ireland), with processing by OpenAI OpCo, LLC (United States). DPA executed. See section 6. |
| Analytics | ReplyOmat.ai does not use third-party analytics that collect personal data. |
| Payment processor | None. No payments are collected. |

All processors are required to process personal data only on our instructions, are barred from
using it for their own purposes, and must apply appropriate security measures.

## 10. Sharing and disclosure

We do not sell your personal data or Google user data. We share data only:

- with the processors in section 9, acting on our behalf;
- where required by law, regulation, court order, or a competent authority, or to establish or
  defend legal claims;
- in a merger, acquisition, or asset sale, with notice to you as required by law; and
- with your specific prior consent.

## 11. Human access to your data

ReplyOmat operates on a least-privilege basis. Access to personal data, including Google user
data, is limited to:

- **Customer support**, only when you have opened a support request or given explicit permission;
- **Security and debugging**, only as needed to investigate incidents, resolve errors, or prevent
  abuse, under documented procedures; and
- **Legal and compliance**, only where required by law or to enforce our terms.

All access is subject to confidentiality obligations and is logged. Staff do not read your review
content for marketing or commercial purposes.

## 12. Security

- All data in transit is encrypted using TLS.
- OAuth refresh tokens and other sensitive data are encrypted at rest.
- Tokens are never exposed in logs or in the interface.
- Access to production systems follows least-privilege principles, with multi-factor
  authentication required for staff access.
- We keep authentication and access audit logs and review them for security purposes.

No system is perfectly secure. If a breach is likely to result in a risk to your rights and
freedoms, we will notify you and the CNPD as required by the GDPR.

## 13. International data transfers

Our infrastructure is located in Portugal (EU). Where personal data is transferred outside the
European Economic Area, for example where our AI provider (contracted via OpenAI Ireland Ltd)
processes data in the United States, or via Cloudflare (United States), we rely on:

- the European Commission's Standard Contractual Clauses; and/or
- the EU-US Data Privacy Framework where the recipient is certified.

## 14. Your rights under the GDPR

You have the right to access, rectification, erasure, restriction, data portability, and objection,
and the right to withdraw consent where processing is based on consent. You also have the right to
lodge a complaint with the CNPD (Comissão Nacional de Proteção de Dados, www.cnpd.pt) or your local
supervisory authority.

To exercise any right, contact jan@replyomat.ai. We respond within the time required by the GDPR,
generally one calendar month, and may need to verify your identity first.

## 15. Cookies and similar technologies

ReplyOmat uses strictly necessary cookies for authentication and session management only. It does
not use analytics, advertising, or other non-essential cookies, so no cookie consent banner is
required. If non-essential cookies are introduced later, this section will be updated and consent
obtained as required by the ePrivacy rules.

## 16. Children's privacy

ReplyOmat.ai is for businesses and business professionals and is not directed at anyone under 18.
We do not knowingly collect personal data from children. If you believe a child has provided us
data, contact us and we will delete it.

## 17. Changes to this policy

We may update this policy to reflect changes in our practices, technology, or legal requirements.
For material changes we will update the "Last updated" date and notify you by email or an in-app
notice, and, where required by law, obtain your consent before the change takes effect.

## 18. Contact

| Detail | Value |
|---|---|
| Data controller | Jan Phillip Winter, sole trader, trading as ReplyOmat |
| Registered address | Rua do Monte dos Judeus 74, apt. B, 4050-411 Porto, Portugal |
| Privacy contact | jan@replyomat.ai |
| Supervisory authority | Comissão Nacional de Proteção de Dados (CNPD), www.cnpd.pt |
