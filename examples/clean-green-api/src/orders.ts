export type OrderStatus = "pending" | "paid" | "cancelled";

export interface Order {
  id: string;
  amountCents: number;
  status: OrderStatus;
}

export function createOrder(id: string, amountCents: number): Order {
  if (amountCents <= 0) {
    throw new Error("amount must be positive");
  }
  return { id, amountCents, status: "pending" };
}

export function markPaid(order: Order): Order {
  if (order.status === "cancelled") {
    throw new Error("cannot pay a cancelled order");
  }
  return { ...order, status: "paid" };
}
