const toRad = (value) => (value * Math.PI) / 180;

// Returns distance in meters
const haversineDistance = (coords1, coords2) => {
  const R = 6371e3; // Earth radius in meters
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);
  const deltaLat = toRad(coords2.lat - coords1.lat);
  const deltaLng = toRad(coords2.lng - coords1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

module.exports = haversineDistance;
