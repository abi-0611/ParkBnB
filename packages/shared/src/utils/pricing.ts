const SERVICE_FEE_RATE = 0.12;
const MIN_SERVICE_FEE = 5;
const OWNER_COMMISSION_RATE = 0.1;

export function calculateServiceFee(basePrice: number): number {
  return Math.max(MIN_SERVICE_FEE, Math.round(basePrice * SERVICE_FEE_RATE * 100) / 100);
}

export function calculateOwnerPayout(basePrice: number): number {
  return Math.round(basePrice * (1 - OWNER_COMMISSION_RATE) * 100) / 100;
}

export function calculateTotalPrice(basePrice: number): number {
  return Math.round((basePrice + calculateServiceFee(basePrice)) * 100) / 100;
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
