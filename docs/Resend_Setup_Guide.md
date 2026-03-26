# Resend Email Service Setup Guide

This guide walks you through setting up Resend as the email service for the SCS Risk Assessment platform.

---

## Prerequisites

- A registered domain name (e.g. `yourdomain.com`)
- Access to your domain's DNS settings (via your domain registrar, e.g. Namecheap, GoDaddy, Cloudflare)
- Access to the Render deployment dashboard for the project

---

## Step 1: Create a Resend Account

1. Go to [https://resend.com](https://resend.com) and click **Get Started**
2. Sign up with your email address
3. Verify your email when prompted

---

## Step 2: Create an API Key

1. In the Resend dashboard, go to **API Keys** in the left sidebar
2. Click **Create API Key**
3. Fill in the details:
   - **Name**: `SCS Risk Assessment` (or any descriptive name)
   - **Permission**: Select **Sending Access**
   - **Domain**: Leave as **All Domains**
4. Click **Add**
5. **Copy the API key immediately** — it will only be shown once
6. Store the API key somewhere safe. You will need it later when configuring the environment variables.

---

## Step 3: Add Your Domain

1. In the Resend dashboard, go to **Domains** in the left sidebar
2. Click **Add Domain**
3. Enter your domain name (e.g. `yourdomain.com`)
4. Select the **Region** closest to your users:
   - For Singapore-based users, select **Tokyo (ap-northeast-1)**
5. Click **Add**

---

## Step 4: Configure DNS Records

After adding your domain, Resend will display a set of DNS records that need to be added to your domain registrar.

### Option A: Auto Configure (Cloudflare only)

If your domain is managed through **Cloudflare**:

1. Click **Auto Configure**
2. Sign in to your Cloudflare account when prompted
3. Resend will automatically add the required DNS records

### Option B: Manual Setup (All other registrars)

If you are using Namecheap, GoDaddy, or any other registrar:

1. Click **Manual Setup**
2. Resend will display three types of DNS records to add:

| Record Type | Purpose |
|-------------|---------|
| **SPF** (TXT record) | Confirms Resend is allowed to send from your domain |
| **DKIM** (TXT record) | Digital signature to verify email authenticity |
| **DMARC** (TXT record) | Policy for handling emails that fail SPF/DKIM checks |

3. Log in to your domain registrar's dashboard
4. Navigate to the **DNS Settings** for your domain
5. Add each record exactly as shown in the Resend dashboard
6. Save your changes

> DNS propagation can take anywhere from a few minutes to 48 hours depending on your registrar.

---

## Step 5: Verify Your Domain

1. Return to the Resend dashboard under **Domains**
2. Click **Verify DNS Records** next to your domain
3. Wait for the status to change to **Verified** 

> If verification fails, double-check that all DNS records were added correctly and try again after a few minutes.

---

## Step 6: Configure Environment Variables

Once your domain is verified, update the environment variables in your **Render** deployment.

### On Render:

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Select your **SCS Risk Assessment** service
3. Go to the **Environment** tab
4. Update the following variables:

| Variable | Value |
|----------|-------|
| `EMAIL_HOST` | `smtp.resend.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | `resend` |
| `EMAIL_PASSWORD` | Your Resend API key (e.g. `re_xxxxxxxxxxxx`) |
| `EMAIL_FROM` | `Singapore Cancer Society <noreply@yourdomain.com>` |

> Replace `yourdomain.com` with your actual verified domain.
> The `EMAIL_USER` value is always `resend` — this never changes regardless of your domain.

5. Click **Save Changes**
6. Render will automatically redeploy the service with the new configuration

---

## Step 7: Verify the Setup

After the service redeploys, check the Render logs to confirm the email service is working:

1. Go to your Render service → **Logs** tab
2. Look for this message on startup:

```
✓ Resend API email service is ready
```

If you see this, the email service is correctly configured and ready to send emails.

---

## Troubleshooting

### `✗ Resend API error: Invalid API key`
- Double-check the `EMAIL_PASSWORD` value in Render — make sure there are no extra spaces or newline characters
- Regenerate the API key in Resend if needed

### `✗ Email service error: getaddrinfo ENOTFOUND smtp.resend.com`
- Check `EMAIL_HOST` in Render for trailing spaces or newline characters (`\n`)
- Clear the value and retype `smtp.resend.com` manually

### Domain not verifying
- Ensure all three DNS records (SPF, DKIM, DMARC) have been added correctly
- DNS propagation can take up to 48 hours — wait and try again
- Contact your domain registrar's support if records are not resolving

### Emails going to spam
- Ensure your domain is fully verified (all three DNS records showing as verified in Resend)
- Check that `EMAIL_FROM` uses your verified domain and not `onboarding@resend.dev`

---

## Email Sending Limits

Resend's free plan includes **3,000 emails per month** and **100 emails per day**, which is sufficient for most deployments. If higher volume is needed, refer to [https://resend.com/pricing](https://resend.com/pricing) for paid plan options.

---