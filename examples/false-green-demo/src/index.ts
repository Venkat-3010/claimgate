export function add(a: number, b: number): number {
  return a + b;
}

export function criticalBillingPath(amount: number): boolean {
  if (amount < 0) throw new Error("negative");
  return amount > 0;
}
