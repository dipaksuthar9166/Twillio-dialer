export const getAuthHeaders = () => {
  const token = localStorage.getItem("userToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const digitsOnly = (num) => (num ? String(num).replace(/\D/g, "") : "");

export const last10 = (num) => digitsOnly(num).slice(-10);

export const compareNumbers = (a, b) => {
  const da = last10(a);
  const db = last10(b);
  return da && db && da === db;
};

export const formatMessageTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return ''; // Invalid date string

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // 🟢 FIX: Return "Now" for messages sent less than a minute ago
  const diffSeconds = (now.getTime() - date.getTime()) / 1000;
  if (diffSeconds < 60) return 'Now';

  // Check if the message was sent today
  if (msgDate.getTime() === today.getTime()) {
    // Format as HH:MM
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // Format as "16 Nov" for older dates
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
};

// 🟢 NEW: Always return time (HH:MM AM/PM) for message bubbles
export const formatTimeOnly = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const relativeLastSeen = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'a while ago';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return d.toLocaleDateString();
};

export const normalizeAndSortMessages = (msgs = [], myFromNumber) => {
  const myDigits = last10(myFromNumber);

  const normalized = msgs.map((msg, index) => {
    const messageSid =
      msg.sid ||
      msg.id ||
      msg.messageSid ||
      msg.sms_sid ||
      msg.whatsappMessageSid ||
      `msg_${index}_${Date.now()}`;

    const sentAt =
      msg.sent_at ||
      msg.createdAt ||
      msg.updatedAt ||
      msg.time ||
      msg.timestamp ||
      new Date().toISOString();

    const fromNumber = msg.from ?? msg.from_number ?? msg.sender;
    const isSelf = myDigits && compareNumbers(fromNumber, myFromNumber);

    const resolvedStatus =
      msg.status ||
      (isSelf ? 'sent' : 'received');

    return {
      ...msg,
      id: messageSid,
      sid: messageSid,
      sent_at: sentAt,
      text: msg.text ?? msg.body ?? msg.message ?? '',
      sender: msg.sender || (isSelf ? 'self' : 'other'),
      status: resolvedStatus,
      delivered_at: msg.delivered_at || msg.deliveredAt,
      read_at: msg.read_at || msg.readAt,
    };
  });

  return normalized.sort(
    (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
  );
};