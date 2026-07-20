export interface CartItem {
  sku: string;
  quantity: number;
  unitPriceCents: number;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
}

/** Broken: treats free items as paid — agent skipped the regression test. */
export function applyPromo(totalCents: number, code: string | undefined): number {
  if (!code) return totalCents;
  if (code === "HALF") return Math.floor(totalCents / 2);
  return totalCents;
}

export function checkoutRequiresAuth(userId: string | null): boolean {
  return userId !== null && userId.length > 0;
}
