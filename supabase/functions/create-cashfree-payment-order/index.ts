import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, service);
    const { data: { user } } = await client.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    const { orderId } = await req.json();
    if (!orderId) return new Response(JSON.stringify({ error: "orderId is required" }), { status: 400, headers: cors });
    const { data: order, error: orderError } = await client.from("orders").select("id, customer_id, total_amount, status").eq("id", orderId).eq("customer_id", user.id).maybeSingle();
    if (orderError || !order) return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: cors });
    if (order.status !== "PAYMENT_PENDING") return new Response(JSON.stringify({ error: "Order is not awaiting payment" }), { status: 409, headers: cors });
    const clientId = Deno.env.get("CASHFREE_CLIENT_ID");
    const clientSecret = Deno.env.get("CASHFREE_CLIENT_SECRET");
    if (!clientId || !clientSecret) return new Response(JSON.stringify({ error: "Cashfree credentials are not configured" }), { status: 503, headers: cors });
    const base = Deno.env.get("CASHFREE_ENVIRONMENT") === "PRODUCTION" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
    const customerPhone = user.phone?.replace(/^\+91/, "") || "9999999999";
    const cfOrderId = `gw_${order.id.replaceAll("-", "").slice(0, 24)}`;
    const response = await fetch(`${base}/orders`, { method: "POST", headers: { "Content-Type": "application/json", "x-api-version": "2025-01-01", "x-client-id": clientId, "x-client-secret": clientSecret, "x-idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ order_id: cfOrderId, order_amount: Number(order.total_amount), order_currency: "INR", customer_details: { customer_id: user.id, customer_phone: customerPhone }, order_note: `Gwalawala order ${order.id}` }) });
    const payload = await response.json();
    if (!response.ok) return new Response(JSON.stringify({ error: payload?.message || "Cashfree order creation failed" }), { status: 502, headers: cors });
    await admin.from("payment_transactions").upsert({ order_id: order.id, provider: "CASHFREE", provider_order_id: payload.order_id || cfOrderId, amount: order.total_amount, currency: "INR", status: "CREATED" }, { onConflict: "provider_order_id" });
    return new Response(JSON.stringify({ orderId: order.id, cashfreeOrderId: payload.order_id || cfOrderId, paymentSessionId: payload.payment_session_id, environment: Deno.env.get("CASHFREE_ENVIRONMENT") === "PRODUCTION" ? "PRODUCTION" : "SANDBOX" }), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unexpected error" }), { status: 500, headers: cors });
  }
});