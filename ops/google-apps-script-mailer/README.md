# CyberJocx Gmail mail relay (Google Apps Script)

This lets the CyberJocx Cloudflare Worker send transactional email from the Gmail account that owns this Apps Script. It requires no custom sending domain and no Resend account.

## 1. Create the script

1. Sign in to Google as **gebrilfares972@gmail.com**.
2. Open https://script.google.com/home/start.
3. Create a new project named **CyberJocx Mail Relay**.
4. Replace the editor contents with `Code.gs` from this folder and save.

## 2. Set a private shared token

1. Generate a random secret of at least 32 characters using a password manager.
2. In Apps Script, open **Project Settings** (gear icon).
3. Under **Script Properties**, click **Add script property**.
4. Set property name to `MAIL_API_TOKEN` and property value to the generated secret.
5. Save. Do not put this token in the source code or send it in chat.

## 3. Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Select type **Web app**.
3. Set **Execute as** to **Me (gebrilfares972@gmail.com)**.
4. Set **Who has access** to **Anyone**. The endpoint is protected by the shared token checked in `doPost`.
5. Click **Deploy** and approve the Gmail permission prompt.
6. Copy the Web app URL ending in `/exec`.

If you change the script code later, use **Deploy → Manage deployments → Edit → New version → Deploy**.

## 4. Add two values to the Cloudflare Worker

Open Cloudflare Dashboard → Workers & Pages → **cyberjocx-api** → Settings → Variables and Secrets.

Add:
- Secret `GMAIL_SCRIPT_TOKEN`: the same random secret entered as the Apps Script `MAIL_API_TOKEN`.
- Variable `GMAIL_SCRIPT_URL`: the Web app URL ending in `/exec`.

Keep the existing database, OAuth, Hyperdrive, and other bindings unchanged. Save and deploy the Worker.

## 5. Test

- Visit the CyberJocx Support page and submit a test message using an email address you control.
- Confirm the message arrives at **gebrilfares972@gmail.com**.
- Use Forgot Password with a test account whose mailbox you control; open the one-time link, set a new password, then sign in with it.

The password is never emailed. Only a single-use reset link (30-minute expiry) is sent; the password hash is updated in the database after the user chooses the new password.
