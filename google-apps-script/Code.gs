/**
 * CyberJocx Gmail Bridge
 *
 * Deploy this project as a Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Required Script Properties:
 *   GMAIL_BRIDGE_TOKEN   A long random secret shared with the CyberJocx Worker.
 *   SUPPORT_INBOX_EMAIL  gebrilfares972@gmail.com
 *
 * This script only sends three application message types. It does not read the inbox.
 */

const APP_NAME = "CyberJocx";
const MAX_SUBJECT_LENGTH = 180;
const MAX_BODY_LENGTH = 12000;

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function isValidEmail(value) {
  return typeof value === "string" &&
    value.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function constantTimeEquals(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function doGet() {
  return jsonResponse({
    ok: true,
    service: "CyberJocx Gmail Bridge",
    message: "Send a POST request from the CyberJocx API."
  });
}

function doPost(event) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const expectedToken = properties.getProperty("GMAIL_BRIDGE_TOKEN");
    const supportInbox = properties.getProperty("SUPPORT_INBOX_EMAIL") || "gebrilfares972@gmail.com";

    if (!expectedToken || expectedToken.length < 32) {
      return jsonResponse({ ok: false, error: "Bridge is not configured." });
    }

    const rawBody = event && event.postData && event.postData.contents;
    if (!rawBody || rawBody.length > 20000) {
      return jsonResponse({ ok: false, error: "Invalid request body." });
    }

    const payload = JSON.parse(rawBody);
    if (!constantTimeEquals(payload.token, expectedToken)) {
      return jsonResponse({ ok: false, error: "Unauthorized." });
    }

    const type = payload.type;
    const subject = String(payload.subject || "").replace(/[\r\n]+/g, " ").trim();
    const textBody = String(payload.text || "");
    const htmlBody = String(payload.html || "");
    const replyTo = payload.replyTo ? String(payload.replyTo).trim() : "";

    if (!subject || subject.length > MAX_SUBJECT_LENGTH ||
        textBody.length < 1 || textBody.length > MAX_BODY_LENGTH ||
        htmlBody.length > MAX_BODY_LENGTH) {
      return jsonResponse({ ok: false, error: "Invalid message content." });
    }

    let recipient = "";
    if (type === "support") {
      if (!isValidEmail(supportInbox) || !isValidEmail(replyTo)) {
        return jsonResponse({ ok: false, error: "Invalid support address." });
      }
      if (!subject.startsWith("[CyberJocx Support]")) {
        return jsonResponse({ ok: false, error: "Invalid support subject." });
      }
      recipient = supportInbox;
    } else if (type === "password_reset") {
      if (!isValidEmail(payload.to) || subject !== "Reset your CyberJocx password") {
        return jsonResponse({ ok: false, error: "Invalid password reset message." });
      }
      recipient = String(payload.to).trim().toLowerCase();
    } else if (type === "password_changed") {
      if (!isValidEmail(payload.to) || subject !== "Your CyberJocx password was changed") {
        return jsonResponse({ ok: false, error: "Invalid password change notification." });
      }
      recipient = String(payload.to).trim().toLowerCase();
    } else {
      return jsonResponse({ ok: false, error: "Unsupported message type." });
    }

    if (MailApp.getRemainingDailyQuota() < 1) {
      return jsonResponse({ ok: false, error: "Daily email quota reached." });
    }

    const options = {
      name: APP_NAME,
      htmlBody: htmlBody || undefined
    };
    if (type === "support" && replyTo) {
      options.replyTo = replyTo;
    }

    MailApp.sendEmail(recipient, subject, textBody, options);

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("CyberJocx Gmail Bridge failed: " +
      (error && error.message ? error.message : "Unknown error"));
    return jsonResponse({ ok: false, error: "Email delivery failed." });
  }
}

/**
 * Run this function manually once from the Apps Script editor.
 * It requests the Mail permission and sends a real test email to your inbox.
 */
function testGmailBridge() {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty("GMAIL_BRIDGE_TOKEN");
  const inbox = properties.getProperty("SUPPORT_INBOX_EMAIL") || "gebrilfares972@gmail.com";

  if (!token || token.length < 32) {
    throw new Error("Set GMAIL_BRIDGE_TOKEN in Script Properties first.");
  }
  if (!isValidEmail(inbox)) {
    throw new Error("SUPPORT_INBOX_EMAIL is invalid.");
  }
  if (MailApp.getRemainingDailyQuota() < 1) {
    throw new Error("No email recipients remain in today's quota.");
  }

  MailApp.sendEmail(
    inbox,
    "CyberJocx Gmail Bridge test",
    "Your CyberJocx Gmail Bridge is authorized and can send email.",
    { name: APP_NAME }
  );
}
