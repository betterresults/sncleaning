import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Define coverage data by borough/area name
    const coverageData = {
      // Inner London Boroughs
      "Camden": ["NW1", "NW5", "NW3"],
      "Greenwich": ["SE10", "SE3", "SE7", "SE8", "SE18"],
      "Hackney": ["E8", "E9", "N1", "N16"],
      "Hammersmith and Fulham": ["W3", "W4", "W6", "W12", "W14"],
      "Islington": ["N1", "N4", "N5", "N7", "N19"],
      "Kensington and Chelsea": ["W8", "W10", "W11", "SW3", "SW5", "SW7", "SW10"],
      "Lambeth": ["SE1", "SE11", "SE21", "SE24", "SE27", "SW2", "SW4", "SW8", "SW9", "SW12", "SW16"],
      "Lewisham": ["SE4", "SE6", "SE13", "SE14", "SE23", "SE26"],
      "Southwark": ["SE1", "SE5", "SE15", "SE16", "SE17", "SE21", "SE22"],
      "Tower Hamlets": ["E1", "E2", "E3", "E14", "E1W"],
      "Wandsworth": ["SW4", "SW8", "SW11", "SW12", "SW15", "SW17", "SW18", "SW19"],
      "Westminster": ["W1", "W2", "W9", "SW1", "NW1", "NW8"],
      // Outer London Boroughs
      "Barking and Dagenham": ["RM8", "RM9", "RM10"],
      "Barnet": ["N2", "N3", "N11", "N12", "N20", "NW2", "NW4", "NW7", "NW9", "NW11"],
      "Bexley": ["DA5", "DA6", "DA7", "DA14", "DA15", "DA16", "DA17"],
      "Brent": ["NW2", "NW6", "NW9", "NW10", "HA0", "HA1", "HA9"],
      "Bromley": ["BR1", "BR2", "BR3", "BR4", "BR5", "BR6", "BR7"],
      "Croydon": ["CR0", "CR2", "CR4", "CR5", "CR7", "CR8"],
      "Ealing": ["W5", "W7", "W13", "UB1", "UB2", "UB5", "UB6"],
      "Enfield": ["EN1", "EN2", "EN3", "EN4", "N9", "N14", "N18", "N21"],
      "Haringey": ["N4", "N8", "N10", "N15", "N17", "N22"],
      "Harrow": ["HA1", "HA2", "HA3", "HA5", "HA7", "HA8"],
      "Havering": ["RM1", "RM2", "RM3", "RM4", "RM5", "RM7", "RM11", "RM12"],
      "Hillingdon": ["UB3", "UB4", "UB7", "UB8", "UB10", "HA4"],
      "Hounslow": ["TW3", "TW4", "TW5", "TW7", "TW8", "UB2", "UB3"],
      "Kingston upon Thames": ["KT1", "KT2", "KT3", "KT5", "KT6", "KT9"],
      "Merton": ["SW19", "SW20", "SM4"],
      "Newham": ["E6", "E7", "E12", "E13", "E15", "E16", "E20"],
      "Redbridge": ["IG1", "IG2", "IG3", "IG4", "IG5", "IG6", "IG8"],
      "Richmond upon Thames": ["TW9", "TW10", "TW1", "TW2", "SW13", "SW14"],
      "Sutton": ["SM1", "SM2", "SM3", "SM5", "SM6"],
      "Waltham Forest": ["E4", "E10", "E11", "E17", "IG8"],
      // Essex
      "Essex - Basildon": ["SS13", "SS14", "SS15", "SS16"],
      "Essex - Brentwood": ["CM13", "CM14", "CM15"],
      "Essex - Romford / Thurrock Edge": ["RM1", "RM2", "RM3", "RM4", "RM5", "RM6", "RM7", "RM8", "RM9", "RM10", "RM11", "RM12", "RM13", "RM14", "RM15", "RM16"],
      "Essex - Chelmsford": ["CM1", "CM2", "CM3"],
      "Essex - Southend-on-Sea": ["SS0", "SS1", "SS2"],
      "Essex - Rayleigh": ["SS6"],
      "Essex - Benfleet": ["SS7"],
      "Essex - Canvey Island": ["SS8"],
      "Essex - Leigh-on-Sea": ["SS9"],
      // South Yorkshire
      "Sheffield": ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S17", "S18", "S20", "S21", "S25", "S26"]
    };

    const results: {
      regions: string[];
      boroughs: string[];
      postcodes: string[];
      skipped: string[];
    } = { regions: [], boroughs: [], postcodes: [], skipped: [] };

    // Additive only — never wipe. A full delete cascades into cleaner_coverage_areas
    // and destroys per-cleaner area assignments.
    const { data: existingRegions } = await supabase
      .from("coverage_regions")
      .select("id, name, display_order");
    const regionByName = new Map((existingRegions || []).map((r: any) => [r.name, r]));

    const maxOrder = Math.max(0, ...(existingRegions || []).map((r: any) => r.display_order || 0));
    let displayOrder = maxOrder + 1;

    for (const [regionName, postcodes] of Object.entries(coverageData)) {
      console.log(`Ensuring region: ${regionName}`);

      let region = regionByName.get(regionName);
      if (!region) {
        const { data: created, error: regionError } = await supabase
          .from("coverage_regions")
          .insert({ name: regionName, display_order: displayOrder })
          .select("id, name, display_order")
          .single();

        if (regionError || !created) {
          console.error(`Error creating region ${regionName}:`, regionError);
          continue;
        }
        region = created;
        regionByName.set(regionName, created);
        results.regions.push(regionName);
        displayOrder++;
      }

      let { data: borough } = await supabase
        .from("coverage_boroughs")
        .select("id")
        .eq("region_id", region.id)
        .eq("name", "General")
        .maybeSingle();

      if (!borough) {
        const { data: createdBorough, error: boroughError } = await supabase
          .from("coverage_boroughs")
          .insert({
            region_id: region.id,
            name: "General",
            display_order: 1,
          })
          .select("id")
          .single();

        if (boroughError || !createdBorough) {
          console.error(`Error creating borough for ${regionName}:`, boroughError);
          continue;
        }
        borough = createdBorough;
        results.boroughs.push(`${regionName} - General`);
      }

      // Insert prefixes one-by-one so a duplicate prefix (UNIQUE) does not
      // abort the whole borough batch and leave the region with 0 postcodes.
      let added = 0;
      for (const prefix of postcodes) {
        const { error: postcodeError } = await supabase
          .from("postcode_prefixes")
          .insert({
            borough_id: borough.id,
            prefix,
            domestic_cleaning: true,
            airbnb_cleaning: true,
            end_of_tenancy: true,
            is_active: true,
          });

        if (postcodeError) {
          results.skipped.push(`${prefix}@${regionName}`);
          continue;
        }
        results.postcodes.push(prefix);
        added += 1;
      }
      console.log(`Added ${added}/${postcodes.length} postcodes to ${regionName}`);
    }

    console.log("Coverage data seeding complete!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Coverage data ensured (additive; existing rows preserved)",
        created: {
          regions: results.regions.length,
          boroughs: results.boroughs.length,
          postcodes: results.postcodes.length,
          skipped: results.skipped.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
