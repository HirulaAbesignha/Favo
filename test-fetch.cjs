const jwt = require("jsonwebtoken");

async function main() {
  const token = jwt.sign({ id: 1, role: "admin" }, "change-me-to-long-random", { expiresIn: "1h" });

  try {
    const res = await fetch("http://localhost:3000/api/admin/inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: 4,
        sku: "FAV-TEST-004",
        stock_quantity: 15,
        low_stock_threshold: 5
      })
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

main();
