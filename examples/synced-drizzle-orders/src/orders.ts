export type OrderRow = {
  id: number;
  customerId: number;
  amountCents: number;
  status: "pending" | "paid" | "shipped";
};

export function isPayable(order: OrderRow): boolean {
  return order.status === "pending" && order.amountCents > 0;
}
