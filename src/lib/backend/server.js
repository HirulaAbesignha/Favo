const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------
// Cart Routes
// ----------------------

app.post("/cart/add", async (req, res) => {
    try {
        const { user_id, product_id, variant_id, qty, price } = req.body;
        if (!product_id || qty === undefined || price === undefined) {
            return res.status(400).json({ error: "product_id, qty, and price are required." });
        }
        if (!Number.isInteger(qty) || qty <= 0) {
            return res.status(400).json({ error: "qty must be a positive integer." });
        }

        let [carts] = await pool.query("SELECT * FROM carts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", [user_id || 1]);
        let cartId;

        if (carts.length === 0) {
            const [newCart] = await pool.query("INSERT INTO carts (user_id) VALUES (?)", [user_id || 1]);
            cartId = newCart.insertId;
        } else {
            cartId = carts[0].id;
        }

        const [existingItems] = await pool.query("SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, product_id]);

        if (existingItems.length > 0) {
            const newQty = existingItems[0].qty + qty;
            await pool.query("UPDATE cart_items SET qty = ? WHERE id = ?", [newQty, existingItems[0].id]);
        } else {
            await pool.query(
                "INSERT INTO cart_items (cart_id, product_id, variant_id, qty, price) VALUES (?, ?, ?, ?, ?)",
                [cartId, product_id, variant_id || null, qty, price]
            );
        }

        res.json({ message: "Item added to cart", cart_id: cartId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/cart/:cart_id", async (req, res) => {
    try {
        const { cart_id } = req.params;
        const [items] = await pool.query("SELECT * FROM cart_items WHERE cart_id = ?", [cart_id]);
        res.json({ cart_id, items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/cart/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { qty } = req.body;

        if (isNaN(id)) return res.status(400).json({ error: "Invalid item id" });
        if (!Number.isInteger(qty) || qty <= 0) {
            return res.status(400).json({ error: "qty must be a positive integer." });
        }

        const [result] = await pool.query("UPDATE cart_items SET qty = ? WHERE id = ?", [qty, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Cart item not found" });

        res.json({ message: "Cart updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete("/cart/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM cart_items WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Cart item not found" });

        res.json({ message: "Item removed from cart" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ----------------------
// Order Routes
// ----------------------

app.post("/orders/create", async (req, res) => {
    try {
        const { user_id, cart_id, delivery_method } = req.body;
        if (!cart_id || !delivery_method) {
            return res.status(400).json({ error: "cart_id and delivery_method are required." });
        }

        const [cartItems] = await pool.query("SELECT * FROM cart_items WHERE cart_id = ?", [cart_id]);
        if (cartItems.length === 0) {
            return res.status(400).json({ error: "Cart is empty. Order creation failed." });
        }

        const MAX_STOCK_AVAILABLE = 15;
        for (let item of cartItems) {
            if (item.qty > MAX_STOCK_AVAILABLE) {
                return res.status(400).json({ error: `Insufficient stock for product id ${item.product_id}. Only ${MAX_STOCK_AVAILABLE} available.` });
            }
        }

        let total = 0;
        for (let item of cartItems) {
            total += item.qty * item.price;
        }

        const [orderResult] = await pool.query(
            "INSERT INTO orders (user_id, delivery_method, status, total_amount) VALUES (?, ?, 'PENDING_PAYMENT', ?)",
            [user_id || 1, delivery_method, total]
        );
        const orderId = orderResult.insertId;

        for (let item of cartItems) {
            await pool.query(
                "INSERT INTO order_items (order_id, product_id, variant_id, qty, unit_price) VALUES (?, ?, ?, ?, ?)",
                [orderId, item.product_id, item.variant_id, item.qty, item.price]
            );
        }

        await pool.query("DELETE FROM cart_items WHERE cart_id = ?", [cart_id]);
        res.json({ message: "Order created successfully", orderId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/orders", async (req, res) => {
    try {
        const [orders] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
        const formattedOrders = orders.map(o => ({
            ...o,
            reference_number: `ORD-${String(o.id).padStart(6, '0')}`
        }));
        res.json(formattedOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/orders/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
        if (orders.length === 0) return res.status(404).json({ error: "Order not found" });

        const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [id]);

        const order = { ...orders[0], reference_number: `ORD-${String(orders[0].id).padStart(6, '0')}` };

        res.json({ order, items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/orders/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['PENDING_PAYMENT', 'CONFIRMED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const [result] = await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Order not found" });

        res.json({ message: "Order status updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});