import { describe, expect, it } from "vitest";
import { isPayable } from "../src/orders.js";

describe("orders", () => {
  it("marks positive pending orders as payable", () => {
    expect(isPayable({ id: 1, customerId: 9, amountCents: 1200, status: "pending" })).toBe(true);
  });

  it("rejects paid or zero-amount orders", () => {
    expect(isPayable({ id: 2, customerId: 9, amountCents: 1200, status: "paid" })).toBe(false);
    expect(isPayable({ id: 3, customerId: 9, amountCents: 0, status: "pending" })).toBe(false);
  });
});
