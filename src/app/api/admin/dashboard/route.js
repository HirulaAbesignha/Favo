import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  try {
    const user = verifyToken(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    // Parallel queries for dashboard stats
    const [ordersResult] = await db.query(`
      SELECT 
        COUNT(*) as total_orders, 
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_value
      FROM orders
    `);

    const [usersResult] = await db.query(`
      SELECT COUNT(*) as new_customers FROM users WHERE role = 'customer'
    `);

    const [recentOrders] = await db.query(`
      SELECT o.*, u.name as customer_name
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    // Top Collections with actual revenue from order_items
    const [collectionsDb] = await db.query(`
      SELECT 
          p.collection as name, 
          COALESCE(SUM(oi.quantity), 0) as units_sold, 
          COALESCE(SUM(oi.quantity * oi.price_at_time), 0) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'CANCELLED'
      GROUP BY p.collection
      ORDER BY revenue DESC
      LIMIT 4
    `);
    
    // Monthly sales & order stats for the current year
    const [monthlyDb] = await db.query(`
      SELECT 
          MONTH(created_at) as monthIndex,
          COUNT(*) as orders_count,
          SUM(total_amount) as revenue
      FROM orders
      WHERE YEAR(created_at) = YEAR(CURRENT_DATE()) AND status != 'CANCELLED'
      GROUP BY MONTH(created_at)
    `);

    // Monthly customers for the current year
    const [monthlyCustomersDb] = await db.query(`
      SELECT 
          MONTH(created_at) as monthIndex,
          COUNT(*) as customers_count
      FROM users
      WHERE YEAR(created_at) = YEAR(CURRENT_DATE()) AND role = 'customer'
      GROUP BY MONTH(created_at)
    `);

    // Prepare exactly 12 months arrays for the UI (0 is Jan, 11 is Dec)
    const monthlySales = new Array(12).fill(0);
    const monthlyOrders = new Array(12).fill(0);
    const monthlyAvg = new Array(12).fill(0);
    const monthlyCustomers = new Array(12).fill(0);

    monthlyDb.forEach(row => {
        const mIndex = row.monthIndex - 1;
        monthlySales[mIndex] = parseFloat(row.revenue);
        monthlyOrders[mIndex] = parseInt(row.orders_count);
        monthlyAvg[mIndex] = parseFloat(row.revenue) / parseInt(row.orders_count);
    });

    monthlyCustomersDb.forEach(row => {
        monthlyCustomers[row.monthIndex - 1] = parseInt(row.customers_count);
    });

    const stats = {
        total_revenue: ordersResult[0]?.total_revenue || 0,
        total_orders: ordersResult[0]?.total_orders || 0,
        average_value: ordersResult[0]?.average_value || 0,
        new_customers: usersResult[0]?.new_customers || 0,
        revenue_trend: 12.5,
        orders_trend: 8.2,
        average_trend: 4.1,
        customers_trend: 15.3,
        sparkline_revenue: monthlySales,
        sparkline_orders: monthlyOrders,
        sparkline_avg: monthlyAvg,
        sparkline_customers: monthlyCustomers
    };

    const colors = ["bg-[#e8dcc8]", "bg-[#2a2a2a]", "bg-[#a37250]", "bg-[#f4f0ef]"];
    const collections = collectionsDb.map((c, i) => ({
        name: c.name || "Uncategorized",
        units: `${c.units_sold} Units Sold`,
        revenue: `LKR ${parseFloat(c.revenue).toLocaleString()}`,
        trend: `Stable`,
        isPositive: true,
        color: colors[i % colors.length]
    }));

    if (collections.length === 0) {
        collections.push({ name: "Core Collection", units: "0 Units", revenue: "LKR 0", trend: "0%", isPositive: true, color: "bg-[#e8dcc8]" });
    }

    return NextResponse.json({ 
        ok: true, 
        data: {
            stats,
            recentOrders,
            topCollections: collections,
            monthlySales
        } 
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET DASHBOARD ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
