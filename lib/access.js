// Single-tenant: कोई expiry/trial नहीं — हमेशा allow
export async function checkExpiry(session) {
  if (!session) return false;
  return true;
}