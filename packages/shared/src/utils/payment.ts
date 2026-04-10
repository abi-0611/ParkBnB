/** Razorpay amounts are in paise (integer). */

export function amountToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return Math.round((paise / 100) * 100) / 100;
}

export function generateGateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function isOtpExpired(createdAt: Date, expiryHours = 4): boolean {
  const ms = expiryHours * 60 * 60 * 1000;
  return Date.now() > createdAt.getTime() + ms;
}
