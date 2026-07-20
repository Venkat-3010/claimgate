import { describe, expect, it } from "vitest";
import { parseEnv } from "../src/env.js";
import { createOrder, markPaid } from "../src/orders.js";

describe("orders", () => {
  it("creates a pending order", () => {
    const order = createOrder("ord_1", 2500);
    expect(order.status).toBe("pending");
    expect(order.amountCents).toBe(2500);
  });

  it("rejects non-positive amounts", () => {
    expect(() => createOrder("ord_2", 0)).toThrow(/positive/);
  });

  it("marks pending orders as paid", () => {
    const paid = markPaid(createOrder("ord_3", 100));
    expect(paid.status).toBe("paid");
  });
});

describe("env schema", () => {
  it("parses a valid runtime env", () => {
    const env = parseEnv({
      DATABASE_URL: "file:./dev.db",
      API_PORT: "3000",
      APP_URL: "http://localhost:3000",
    });
    expect(env.API_PORT).toBe(3000);
  });
});
