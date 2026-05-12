import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ordersTable, cartItemsTable, productsTable, insertOrderSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/orders", async (req, res): Promise<void> => {
  try {
    const data = insertOrderSchema.parse(req.body);
    
    const cartItems = await db
      .select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.sessionId, data.sessionId));

    if (cartItems.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    // Grab seller info from the first cart item's product
    let sellerId: number | undefined;
    let sellerName: string | undefined;
    try {
      const firstProductId = cartItems[0].productId;
      const found = await db
        .select({ sellerId: productsTable.sellerId, sellerName: productsTable.sellerName })
        .from(productsTable)
        .where(eq(productsTable.id, firstProductId))
        .limit(1);
      if (found.length > 0) {
        sellerId = found[0].sellerId;
        sellerName = found[0].sellerName;
      }
    } catch {
      // Non-fatal: order proceeds without seller info
    }

    const inserted = await db
      .insert(ordersTable)
      .values({ ...data, status: "pending", sellerId, sellerName })
      .returning();

    await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, data.sessionId));

    res.status(201).json({ ...inserted[0], items: cartItems });
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(400).json({ error: "Invalid data" });
  }
});

export default router;
