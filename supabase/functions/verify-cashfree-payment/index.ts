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

    const { orderId, cashfreeOrderId } = await req.json();
    if (!orderId || !cashfreeOrderId) return new Response(JSON.stringify({ error: "orderId and cashfreeOrderId are required" }), { status: 400, headers: cors });
    const { data: order } = await client.from("orders").select("id,customer_id,total_amount,status").eq("id", orderId).eq("customer_id", user.id).maybeSingle();
    if (!order) return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: cors });

    const clientId = Deno.env.get("CASHFREE_CLIENT_ID");
    const clientSecret = Deno.env.get("CASHFREE_CLIENT_SECRET");
    if (!clientId || !clientSecret) return new Response(JSON.stringify({ error: "Cashfree credentials are not configured" }), { status: 503, headers: cors });
    const base = Deno.env.get("CASHFREE_ENVIRONMENT") === "PRODUCTION" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
    const headers = { "x-api-version": "2025-01-01", "x-client-id": clientId, "x-client-secret": clientSecret };

    const orderResponse = await fetch(`${base}/orders/${encodeURIComponent(cashfreeOrderId)}`, { headers });
    const cfOrder = await orderResponse.json();
    if (!orderResponse.ok) return new Response(JSON.stringify({ error: cfOrder?.message || "Cashfree order lookup failed" }), { status: 502, headers: cors });
    const expectedAmount = Number(order.total_amount);
    const cfOrderAmount = Number(cfOrder?.order_amount);
    if (!Number.isFinite(cfOrderAmount) || Math.abs(cfOrderAmount - expectedAmount) > 0.0001 || cfOrder?.order_currency !== "INR") return new Response(JSON.stringify({ error: "Cashfree order amount/currency does not match Gwalawala order" }), { status: 409, headers: cors });
    if (cfOrder?.order_status !== "PAID") return new Response(JSON.stringify({ success: false, status: cfOrder?.order_status || "UNKNOWN" }), { status: 402, headers: cors });

    const paymentsResponse = await fetch(`${base}/orders/${encodeURIComponent(cashfreeOrderId)}/payments`, { headers });
    const payments = await paymentsResponse.json();
    if (!paymentsResponse.ok || !Array.isArray(payments)) return new Response(JSON.stringify({ error: "Cashfree payment lookup failed" }), { status: 502, headers: cors });
    const successful = payments.find((payment: any) => payment?.payment_status === "SUCCESS" && payment?.cf_payment_id != null);
    if (!successful) return new Response(JSON.stringify({ error: "No successful Cashfree payment found" }), { status: 402, headers: cors });
    const paymentAmount = Number(successful.payment_amount);
    if (!Number.isFinite(paymentAmount) || Math.abs(paymentAmount - expectedAmount) > 0.0001 || successful.payment_currency !== "INR") return new Response(JSON.stringify({ error: "Cashfree payment amount/currency does not match Gwalawala order" }), { status: 409, headers: cors });

    const { data: result, error } = await admin.rpc("mark_cashfree_payment_captured", { p_order_id: order.id, p_provider_order_id: cashfreeOrderId, p_provider_payment_id: String(successful.cf_payment_id), p_amount: paymentAmount, p_currency: "INR" });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 409, headers: cors });
    return new Response(JSON.stringify({ success: true, orderId: result || order.id, status: "CONFIRMED", paymentId: String(successful.cf_payment_id) }), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unexpected error" }), { status: 500, headers: cors });
  }
});
