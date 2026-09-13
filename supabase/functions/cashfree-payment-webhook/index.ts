import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
function timingSafeEqual(a: string, b: string) { if (a.length !== b.length) return false; let result = 0; for (let i=0;i<a.length;i++) result |= a.charCodeAt(i)^b.charCodeAt(i); return result===0; }
function base64(bytes: Uint8Array) { let s=""; bytes.forEach(b=>s+=String.fromCharCode(b)); return btoa(s); }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });
  try {
    const secret = Deno.env.get("CASHFREE_CLIENT_SECRET");
    if (!secret) return new Response(JSON.stringify({ error: "Cashfree credentials are not configured" }), { status: 503, headers: cors });
    const raw = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    if (!signature || !timestamp) return new Response(JSON.stringify({ error: "Missing webhook signature" }), { status: 401, headers: cors });
    const data = new TextEncoder().encode(timestamp + raw);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
    const expected = base64(new Uint8Array(await crypto.subtle.sign("HMAC", key, data)));
    if (!timingSafeEqual(expected, signature)) return new Response(JSON.stringify({ error:"Invalid webhook signature" }), { status:401, headers:cors });

    const payload = JSON.parse(raw);
    const type = String(payload?.type || payload?.event || "");
    const order = payload?.data?.order || {};
    const payment = payload?.data?.payment || {};
    const orderId = order?.order_id ? String(order.order_id) : "";
    const cfPaymentId = payment?.cf_payment_id != null ? String(payment.cf_payment_id) : null;
    const paymentStatus = String(payment?.payment_status || "");
    if (!orderId) return new Response(JSON.stringify({ received:true, ignored:true }), { status:200, headers:cors });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: tx } = await admin.from("payment_transactions").select("id,order_id,status").eq("provider","CASHFREE").eq("provider_order_id",orderId).maybeSingle();
    if (!tx) return new Response(JSON.stringify({ received:true, ignored:true }), { status:200, headers:cors });

    if (paymentStatus === "SUCCESS" || type.includes("SUCCESS") || type.includes("PAID")) {
      const paymentAmount = Number(payment?.payment_amount);
      const orderAmount = Number(order?.order_amount);
      if (!Number.isFinite(paymentAmount) || !Number.isFinite(orderAmount) || payment?.payment_currency !== "INR" || order?.order_currency !== "INR") return new Response(JSON.stringify({ error:"Invalid Cashfree amount/currency" }), { status:409, headers:cors });
      if (Math.abs(paymentAmount-orderAmount)>0.0001) return new Response(JSON.stringify({ error:"Cashfree order/payment amount mismatch" }), { status:409, headers:cors });
      if (!cfPaymentId) return new Response(JSON.stringify({ error:"Missing Cashfree payment identifier" }), { status:409, headers:cors });
      const { error } = await admin.rpc("mark_cashfree_payment_captured", { p_order_id:tx.order_id, p_provider_order_id:orderId, p_provider_payment_id:cfPaymentId, p_amount:paymentAmount, p_currency:"INR" });
      if (error) return new Response(JSON.stringify({ error:error.message }), { status:409, headers:cors });
    } else if (paymentStatus === "FAILED" || type.includes("FAILED")) {
      if (tx.status !== "CAPTURED") await admin.from("payment_transactions").update({ provider_payment_id:cfPaymentId, status:"FAILED", failure_reason:payment?.payment_message || null, updated_at:new Date().toISOString() }).eq("id",tx.id).neq("status","CAPTURED");
    }
    return new Response(JSON.stringify({ received:true }), { status:200, headers:cors });
  } catch (e) { return new Response(JSON.stringify({ error:e instanceof Error?e.message:"Unexpected error" }), { status:500, headers:cors }); }
});
