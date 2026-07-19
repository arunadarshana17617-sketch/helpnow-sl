// 📍 src/app/lib/geo.js
// Shared geo helpers for the broadcast-booking flow.

// Haversine distance in km — same formula used client-side in BookingModal.js
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find providers who offer `category` and are near the customer.
 *
 * If we have a valid customer GPS point, we do a $near geo query against
 * provider.location (2dsphere index already exists on ServiceProvider),
 * then filter down to providers whose OWN maxDistance radius actually
 * covers the customer (a provider with a 10km radius shouldn't get a job
 * 40km away just because the outer search bound is generous).
 *
 * If there's no GPS (customer denied location), we fall back to matching
 * by district/city instead — every provider serving that district/city
 * gets notified.
 *
 * @param {mongoose.Model} ServiceProvider
 * @param {{ category: string, lat?: number, lng?: number, district?: string, city?: string }} params
 * @returns {Promise<Array<{ _id, fullName, email, location, maxDistance, emailAlerts }>>}
 */
export async function findNearbyProviders(ServiceProvider, { category, lat, lng, district, city }) {
  const baseFilter = {
    accountStatus: 'active',
    services: {
      $elemMatch: {
        category,
        isActive: true,
        verificationStatus: 'verified',
      },
    },
  };

  const hasValidCoords =
    typeof lat === 'number' && typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) &&
    !(lat === 0 && lng === 0);

  if (hasValidCoords) {
    // Outer bound of 100km just to keep the geo query cheap — the real
    // cutoff per-provider happens in the filter below via their own maxDistance.
    const nearby = await ServiceProvider.find({
      ...baseFilter,
      locationEnabled: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: 100000,
        },
      },
    });

    return nearby
      .map(p => {
        const coords = p.location?.coordinates;
        if (!coords || coords.length !== 2) return null;
        const [plng, plat] = coords;
        if (plat === 0 && plng === 0) return null;
        const distanceKm = getDistanceKm(lat, lng, plat, plng);
        if (distanceKm > (p.maxDistance || 30)) return null;
        return { provider: p, distanceKm };
      })
      .filter(Boolean);
  }

  // Fallback — no GPS available, match on district/city instead
  const orFilters = [];
  if (district) orFilters.push({ district });
  if (city) orFilters.push({ city });
  if (!orFilters.length) return [];

  const matched = await ServiceProvider.find({ ...baseFilter, $or: orFilters });
  return matched.map(p => ({ provider: p, distanceKm: null }));
}