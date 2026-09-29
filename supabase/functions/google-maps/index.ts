const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const key = Deno.env.get("GOOGLE_MAPS_SERVER_API_KEY");

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function google(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.error?.message || "Google Maps request failed");
  return body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "POST required" }, 405);
  if (!key) return reply({ error: "Google Maps server key is not configured" }, 503);

  try {
    const body = await req.json();

    if (body.action === "search_places") {
      const textQuery = String(body.textQuery || "").trim();
      if (textQuery.length < 3 || textQuery.length > 150) return reply({ error: "Invalid search query" }, 400);
      const result = await google("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
        },
        body: JSON.stringify({ textQuery, languageCode: "en", maxResultCount: 5 }),
      });
      return reply((result.places || []).map((p: any) => ({
        id: p.id,
        name: p.displayName?.text || "",
        formattedAddress: p.formattedAddress || "",
        location: { latitude: p.location?.latitude, longitude: p.location?.longitude },
      })));
    }

    if (body.action === "reverse_geocode") {
      const lat = Number(body.latitude), lng = Number(body.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return reply({ error: "Invalid coordinates" }, 400);
      const url = new URL("https://geocode.googleapis.com/v1/geocode/json");
      url.searchParams.set("latlng", `${lat},${lng}`);
      url.searchParams.set("key", key);
      const result = await google(url.toString());
      return reply({ formattedAddress: result.results?.[0]?.formatted_address || null });
    }

    if (body.action === "route") {
      const o = body.origin, d = body.destination;
      const values = [o?.latitude, o?.longitude, d?.latitude, d?.longitude].map(Number);
      if (values.some((v) => !Number.isFinite(v))) return reply({ error: "Invalid route coordinates" }, 400);
      const result = await google("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: o.latitude, longitude: o.longitude } } },
          destination: { location: { latLng: { latitude: d.latitude, longitude: d.longitude } } },
          travelMode: "DRIVE",
        }),
      });
      const route = result.routes?.[0];
      if (!route) return reply({ error: "No driving route found" }, 404);
      return reply({
        distanceMeters: route.distanceMeters,
        durationSeconds: Number.parseInt(String(route.duration || "0").replace("s", ""), 10),
        encodedPolyline: route.polyline?.encodedPolyline,
      });
    }

    return reply({ error: "Unknown action" }, 400);
  } catch (e) {
    return reply({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
