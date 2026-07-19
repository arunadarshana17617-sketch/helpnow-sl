// 📁 DESTINATION: src/app/lib/ipGeo.js
//
// Looks up an approximate country/region/city for an IP address using
// ipwho.is — a free geolocation API that needs no API key and supports
// HTTPS (important since Vercel serverless functions can only make
// outbound HTTPS calls reliably). Accuracy is city-level at best (IP
// geolocation is never exact — it tells you the ISP's registered
// location, not GPS coordinates), which is enough to spot "wait, this
// login attempt came from a different country than me."
//
// Local/private IPs (localhost, LAN addresses) are skipped since they
// don't resolve to a real-world location — you'll see this when testing
// with `npm run dev` locally, which is expected and not a bug.

export async function lookupIpLocation(ip) {
  if (!ip || ip === "unknown" || isPrivateOrLocal(ip)) {
    return { country: null, region: null, city: null, isp: null };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // don't let a slow lookup hang the login request

    const res = await fetch(`https://ipwho.is/${ip}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { country: null, region: null, city: null, isp: null };

    const data = await res.json();
    if (!data.success) return { country: null, region: null, city: null, isp: null };

    return {
      country: data.country || null,
      region: data.region || null,
      city: data.city || null,
      // ✅ This is what shows Dialog / Mobitel / Hutch / SLT etc. —
      // ipwho.is reports the network operator that owns the IP block.
      isp: data.connection?.isp || null,
    };
  } catch (err) {
    console.error("⚠️ IP geolocation lookup failed:", err.message);
    return { country: null, region: null, city: null, isp: null };
  }
}

function isPrivateOrLocal(ip) {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  return false;
}