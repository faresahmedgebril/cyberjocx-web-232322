# CyberJocx Gmail Bridge Setup

This connects the existing CyberJocx API to the owner's Gmail account using a small Google Apps Script web app. It does not require Resend, a paid email provider, a custom sending domain, or a Gmail API OAuth scope.

The bridge sends only:
- Password-reset links to the account email address.
- A password-changed security notification after the database update succeeds.
- Public support messages to `gebrilfares972@gmail.com`, with Reply-To set to the sender.

It never emails a user's password.

## 1. Create the Apps Script project

1. Sign in to Google using `gebrilfares972@gmail.com`.
2. Open https://script.google.com/home and create a **New project**.
3. Open `Code.gs`, remove the sample function, and paste the contents of [google-apps-script/Code.gs](https://github.com/faresahmedgebril/cyberjocx-web-232322/blob/main/google-apps-script/Code.gs).
4. Rename the project to `CyberJocx Gmail Bridge`.

## 2. Create the shared secret

On Windows PowerShell, generate a random secret (do not use a password you already use):

```powershell
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 48
$rng.GetBytes($bytes)
$GmailBridgeToken = [Convert]::ToBase64String($bytes)
$rng.Dispose()
$GmailBridgeToken
```

Copy the generated value temporarily. Do not put it in GitHub, source code, screenshots, or chat.

In the Apps Script editor:
1. Open **Project Settings** (gear icon).
2. Under **Script Properties**, click **Add script property**.
3. Add `GMAIL_BRIDGE_TOKEN` and paste the generated value as its value.
4. Add `SUPPORT_INBOX_EMAIL` with value `gebrilfares972@gmail.com`.
5. Save the properties.

## 3. Authorize Gmail sending

1. In the function selector beside **Run**, choose `testGmailBridge`.
2. Click **Run**.
3. Review and approve Google's permission request for sending email.
4. Confirm that a message titled **CyberJocx Gmail Bridge test** arrives in `gebrilfares972@gmail.com`.

The script uses Google's Mail service only to send. It does not read Gmail messages.

## 4. Deploy the web app

1. Click **Deploy → New deployment**.
2. Select the gear icon beside **Select type**, then choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**. Requests are protected by the long shared secret.
5. Click **Deploy** and complete any Google confirmation.
6. Copy the Web App URL ending in `/exec`. Do not use the `/dev` test URL.

## 5. Add the two settings to the Cloudflare Worker

Open Cloudflare Dashboard → **Workers & Pages** → `cyberjocx-api` → **Settings** → **Variables and Secrets**.

Add these values:

| Name | Type | Value |
|---|---|---|
| `GMAIL_SCRIPT_URL` | Text | The Apps Script Web App URL ending in `/exec` |
| `GMAIL_SCRIPT_TOKEN` | Secret | The exact same generated token saved as `GMAIL_BRIDGE_TOKEN` in Apps Script |
| `SUPPORT_INBOX_EMAIL` | Text | `gebrilfares972@gmail.com` |

Save and deploy the Worker so the new bindings are active. Keep the token as a Secret.

## 6. Verify in production

1. Open the public [CyberJocx support page](https://faresahmedgebril.github.io/cyberjocx-web-232322/support).
2. Send a test message using a different email address you control.
3. Confirm it reaches `gebrilfares972@gmail.com`, then press Reply and confirm the reply goes to the sender.
4. Use a test account to request a password reset.
5. Open the one-time reset link, choose a new password, and confirm the new password logs in while the old password no longer works.

## Notes

- The free consumer Gmail Apps Script quota is currently 100 email recipients per day. Google may change quotas; the script checks the remaining quota before each send. See [Google Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas).
- If you edit the Apps Script code after deployment, create a new deployment version or update the existing deployment to use the new version.
- If the shared token is exposed, generate a new one and update it in both Apps Script Script Properties and the Cloudflare Worker Secret.
