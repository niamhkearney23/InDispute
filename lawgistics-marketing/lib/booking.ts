// Where "Book a demo" goes. Set BOOKING_URL in the hosting dashboard (a Calendly, Cal.com or
// form link). It must be https and must not carry a username or password, so a setting that is
// wrong, or a javascript: or data: link, is simply treated as not set rather than rendered.
// When it is not set, the buttons that need it are left out instead of pointing nowhere.
export function bookingUrl(): string | null {
  const v = (process.env.BOOKING_URL || "").trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}
