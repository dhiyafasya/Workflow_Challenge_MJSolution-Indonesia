export function logActivity(req, action, targetType = null, targetId = null, details = null, emailOverride = null) {
  const user = req.user || null;
  const email = emailOverride || user?.email || '-';
  const time = new Date().toLocaleTimeString();
  const target = targetType ? ` ${targetType}${targetId ? `[${targetId.slice(0, 8)}]` : ''}` : '';
  const detail = details ? ` ${JSON.stringify(details)}` : '';
  console.log(`[${time}] ${email} → ${action}${target}${detail}`);
}
