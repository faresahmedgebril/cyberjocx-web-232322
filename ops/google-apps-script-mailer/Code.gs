/**
 * CyberJocx Gmail mail relay.
 * Deploy this Apps Script as a Web App that executes as your Google account.
 * Set Script Property MAIL_API_TOKEN to the same random secret stored in
 * Cloudflare Worker secret GMAIL_SCRIPT_TOKEN.
 */
/**
 * Run this once from the Apps Script editor.
 * It stores a new high-entropy token in Script Properties and prints it
 * so you can paste the same value into the Cloudflare Worker secret.
 */
function generateMailToken() {
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty("MAIL_API_TOKEN")) {
    console.log("MAIL_API_TOKEN already exists. It was not changed.");
    return;
  }

  const token = Array.from({ length: 4 }, () => Utilities.getUuid().replace(/-/g, "")).join("");
  properties.setProperty("MAIL_API_TOKEN", token);
  console.log("Copy this token into Cloudflare as the GMAIL_SCRIPT_TOKEN secret:");
  console.log(token);
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const expected = PropertiesService.getScriptProperties().getProperty("MAIL_API_TOKEN") || "";
    const supplied = String(body.token || "");

    if (!expected || !constantTimeEquals_(expected, supplied)) {
      return json_({ ok: false, error: "Unauthorized" });
    }

    const to = String(body.to || "").trim();
    const subject = String(body.subject || "").trim();
    const text = String(body.text || "");
    const html = String(body.html || "");
    const replyTo = String(body.replyTo || "").trim();

    if (!isEmail_(to) || !subject || subject.length > 180) {
      return json_({ ok: false, error: "Invalid recipient or subject" });
    }
    if (!text || text.length > 12000 || html.length > 20000) {
      return json_({ ok: false, error: "Invalid message body" });
    }
    if (replyTo && !isEmail_(replyTo)) {
      return json_({ ok: false, error: "Invalid reply address" });
    }

    const options = {
      name: "CyberJocx",
      htmlBody: html || undefined
    };
    if (replyTo) options.replyTo = replyTo;

    GmailApp.sendEmail(to, subject, text, options);
    return json_({ ok: true });
  } catch (error) {
    // Never log the request body or secret token.
    console.error("CyberJocx mail relay failed: " + String(error && error.message || error));
    return json_({ ok: false, error: "Mail delivery failed" });
  }
}

function isEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function constantTimeEquals_(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
