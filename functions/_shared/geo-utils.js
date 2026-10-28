import { PYEONGTAEK_BOUNDARY } from './pyeongtaek-boundary.js';

// Browser fixes less precise than this (e.g. coarse IP-based positioning) are not trusted.
export const MAX_GEO_ACCURACY_METERS = 5000;

const METERS_PER_DEGREE_LAT = 111320;

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

export const normalizeGeoInput = (geo) => {
    if (!geo || typeof geo !== 'object') return null;
    const { lat, lng, accuracy } = geo;
    if (![lat, lng, accuracy].every(isFiniteNumber)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    if (accuracy <= 0 || accuracy > MAX_GEO_ACCURACY_METERS) return null;
    return { lat, lng, accuracy };
};

const ringContains = (ring, lng, lat) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
};

const polygonContains = (polygon, lng, lat) => {
    const [outer, ...holes] = polygon;
    return ringContains(outer, lng, lat) && !holes.some((hole) => ringContains(hole, lng, lat));
};

const distanceToSegmentMeters = (lng, lat, [ax, ay], [bx, by]) => {
    const kx = METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180);
    const px = (lng - ax) * kx;
    const py = (lat - ay) * METERS_PER_DEGREE_LAT;
    const dx = (bx - ax) * kx;
    const dy = (by - ay) * METERS_PER_DEGREE_LAT;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared ? Math.max(0, Math.min(1, (px * dx + py * dy) / lengthSquared)) : 0;
    return Math.hypot(px - t * dx, py - t * dy);
};

const distanceToBoundaryMeters = (polygons, lng, lat) => {
    let min = Infinity;
    for (const polygon of polygons) {
        for (const ring of polygon) {
            for (let i = 0; i < ring.length - 1; i += 1) {
                min = Math.min(min, distanceToSegmentMeters(lng, lat, ring[i], ring[i + 1]));
            }
        }
    }
    return min;
};

// Returns 'inside' / 'outside' when the whole accuracy circle is on one side of the boundary,
// and 'ambiguous' when the boundary passes through it.
export const classifyAgainstPolygons = (polygons, { lat, lng, accuracy }) => {
    const inside = polygons.some((polygon) => polygonContains(polygon, lng, lat));
    return distanceToBoundaryMeters(polygons, lng, lat) <= accuracy
        ? 'ambiguous'
        : (inside ? 'inside' : 'outside');
};

export const classifyPyeongtaekLocation = (geo) => {
    const normalized = normalizeGeoInput(geo);
    return normalized ? classifyAgainstPolygons(PYEONGTAEK_BOUNDARY, normalized) : 'unavailable';
};

export const isPyeongtaekCity = (city) => /pyeong\s*-?\s*taek/i.test(String(city || ''));

// Server-side region decision. Browser location wins when it is conclusive; otherwise the
// Cloudflare IP city decides. Never returns coordinates.
export const resolveContactRegion = (geo, ipCity) => {
    const browser = classifyPyeongtaekLocation(geo);
    if (browser === 'inside') return { pyeongtaek: true, source: 'browser' };
    if (browser === 'outside') return { pyeongtaek: false, source: 'browser' };
    return { pyeongtaek: isPyeongtaekCity(ipCity), source: 'ip' };
};
