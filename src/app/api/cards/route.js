import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function detectCardBrand(cardNumber) {
  if (cardNumber.startsWith("4")) return "VISA";
  if (cardNumber.startsWith("5")) return "MASTERCARD";
  if (cardNumber.startsWith("3")) return "AMEX";
  return "OTHER";
}

export async function GET(request) {
  try {
    let user = verifyToken(request);
    if (!user) {
      user = { userId: 1, role: 'user' }; 
    }
    
    const [rows] = await db.query(
      "SELECT * FROM saved_cards WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [user.userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, message: "No saved cards" }, { headers: corsHeaders });
    }

    return NextResponse.json({ ok: true, card: rows[0] }, { headers: corsHeaders });

  } catch (error) {
    console.error("GET SAVED CARD ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request) {
  try {
    let user = verifyToken(request);

    // Fallback for Demo testing without login context:
    if (!user) {
      user = { userId: 1, role: 'user' }; 
      // Note: If user 1 doesn't exist in DB, foreign key checks will fail.
    }

    const body = await request.json();

    const cardholderName = (body.cardholderName || "").trim();
    const cardNumber = (body.cardNumber || "").replace(/\s/g, "");
    const expiryMonth = (body.expiryMonth || "").trim();
    const expiryYear = (body.expiryYear || "").trim();
    const saveCard = body.saveCard;

    if (!saveCard) {
      return NextResponse.json({
        ok: true,
        message: "Card not saved because save option was not selected"
      }, { headers: corsHeaders });
    }

    if (!cardholderName || !cardNumber || !expiryMonth || !expiryYear) {
      return NextResponse.json(
        { ok: false, error: "Missing required card fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (cardNumber.length < 12) {
      return NextResponse.json(
        { ok: false, error: "Invalid card number" },
        { status: 400, headers: corsHeaders }
      );
    }

    const last4 = cardNumber.slice(-4);
    const maskedCardNumber = "**** **** **** " + last4;
    const cardBrand = detectCardBrand(cardNumber);

    await db.query(
      `INSERT INTO saved_cards
       (user_id, cardholder_name, card_brand, last4, masked_card_number, expiry_month, expiry_year)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.userId,
        cardholderName,
        cardBrand,
        last4,
        maskedCardNumber,
        expiryMonth,
        expiryYear
      ]
    );

    return NextResponse.json({
      ok: true,
      message: "Card saved successfully"
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("SAVE CARD ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}