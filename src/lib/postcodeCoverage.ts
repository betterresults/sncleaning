import { supabase } from '@/integrations/supabase/client';

export interface ResolvedBorough {
  boroughId: string;
  boroughName: string;
  regionName: string;
}

export interface PostcodePrefixEntry {
  prefix: string;
  boroughId: string;
  boroughName: string;
  regionName: string;
}

// UK outward codes look like "E1", "SW1A", "RM10" etc. A full postcode has an inward
// code appended ("E1 6AN" -> outward "E1"). This strips whitespace/casing and, if a
// full postcode was pasted in, returns just the outward code used by postcode_prefixes.
export const extractOutwardCode = (postcode: string): string => {
  const clean = postcode.replace(/\s/g, '').toUpperCase();
  const fullPostcodePattern = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\d[A-Z]{2}$/;
  const match = clean.match(fullPostcodePattern);
  if (match) return match[1];
  return clean;
};

// Resolves a raw postcode string to the coverage borough it falls under, trying the
// full outward code first and then progressively shorter prefixes (e.g. "SW1A" -> "SW1"
// -> "SW") until a configured postcode_prefixes row matches. Returns null if the
// postcode is empty or doesn't match any configured area.
export const resolvePostcodeToBorough = async (
  postcode: string | null | undefined
): Promise<ResolvedBorough | null> => {
  if (!postcode || !postcode.trim()) return null;

  const outward = extractOutwardCode(postcode);
  if (!outward) return null;

  const selectClause = `
    borough_id,
    coverage_boroughs!inner (
      name,
      coverage_regions!inner ( name )
    )
  `;

  for (let len = outward.length; len >= 1; len -= 1) {
    const candidate = outward.slice(0, len);
    const { data } = await supabase
      .from('postcode_prefixes')
      .select(selectClause)
      .eq('prefix', candidate)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      const borough = (data as any).coverage_boroughs;
      return {
        boroughId: (data as any).borough_id,
        boroughName: borough?.name ?? 'Unknown',
        regionName: borough?.coverage_regions?.name ?? 'Unknown',
      };
    }
  }

  return null;
};

// In-memory variant of the resolution loop above, for matching many bookings against a
// single already-fetched postcode_prefixes index (e.g. a list view) without a DB
// round-trip per row. Build the index once with a plain select of postcode_prefixes
// joined to boroughs/regions.
export const matchPostcodeToBorough = (
  postcode: string | null | undefined,
  index: PostcodePrefixEntry[]
): ResolvedBorough | null => {
  if (!postcode || !postcode.trim()) return null;
  const outward = extractOutwardCode(postcode);
  if (!outward) return null;

  for (let len = outward.length; len >= 1; len -= 1) {
    const candidate = outward.slice(0, len);
    const match = index.find((entry) => entry.prefix === candidate);
    if (match) {
      return { boroughId: match.boroughId, boroughName: match.boroughName, regionName: match.regionName };
    }
  }

  return null;
};
