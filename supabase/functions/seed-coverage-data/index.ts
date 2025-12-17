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

    // Define coverage data
    const coverageData = {
      "Central London": ["EC1", "EC2", "EC3", "EC4", "WC1", "WC2", "W1", "SW1"],
      "North London": ["N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8", "N9", "N10", "N11", "N12", "N13", "N14", "N15", "N16", "N17", "N18", "N19", "N20", "N21", "N22"],
      "East London": ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17", "E18"],
      "South East London": ["SE1", "SE2", "SE3", "SE4", "SE5", "SE6", "SE7", "SE8", "SE9", "SE10", "SE11", "SE12", "SE13", "SE14", "SE15", "SE16", "SE17", "SE18", "SE19", "SE20", "SE21", "SE22", "SE23", "SE24", "SE25", "SE26", "SE27", "SE28"],
      "South West London": ["SW2", "SW3", "SW4", "SW5", "SW6", "SW7", "SW8", "SW9", "SW10", "SW11", "SW12", "SW13", "SW14", "SW15", "SW16", "SW17", "SW18", "SW19", "SW20"],
      "West London": ["W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12", "W13", "W14"],
      "Outer London": [
        "HA0", "HA1", "HA2", "HA3", "HA4", "HA5", "HA6", "HA7", "HA8", "HA9",
        "UB1", "UB2", "UB3", "UB4", "UB5", "UB6", "UB7", "UB8", "UB9", "UB10",
        "TW1", "TW2", "TW3", "TW4", "TW5", "TW6", "TW7", "TW8", "TW9", "TW10", "TW11", "TW12", "TW13",
        "KT1", "KT2", "KT3", "KT4", "KT5", "KT6", "KT7", "KT8", "KT9",
        "SM1", "SM2", "SM3", "SM4", "SM5", "SM6", "SM7",
        "CR0", "CR2", "CR3", "CR4", "CR5", "CR6", "CR7", "CR8",
        "BR1", "BR2", "BR3", "BR4", "BR5", "BR6", "BR7", "BR8",
        "DA5", "DA6", "DA7", "DA14", "DA15", "DA16", "DA17",
        "RM1", "RM2", "RM3", "RM4", "RM5", "RM6", "RM7", "RM8", "RM9", "RM10", "RM11", "RM12", "RM13", "RM14", "RM15",
        "IG1", "IG2", "IG3", "IG4", "IG5", "IG6", "IG7", "IG8", "IG9",
        "EN1", "EN2", "EN3", "EN4", "EN5", "EN6", "EN7", "EN8", "EN9"
      ]
    };

    const results: any = { regions: [], boroughs: [], postcodes: [] };

    // Update South London to South East London
    await supabase
      .from("coverage_regions")
      .update({ name: "South East London" })
      .eq("name", "South London");

    // Delete existing boroughs and postcodes to start fresh
    const { data: existingRegions } = await supabase
      .from("coverage_regions")
      .select("id, name");

    // Delete all existing postcodes
    await supabase.from("postcode_prefixes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    // Delete all existing boroughs
    await supabase.from("coverage_boroughs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Process each region
    let displayOrder = 1;
    for (const [regionName, postcodes] of Object.entries(coverageData)) {
      // Check if region exists
      let { data: region } = await supabase
        .from("coverage_regions")
        .select("id")
        .eq("name", regionName)
        .single();

      // Create region if it doesn't exist
      if (!region) {
        const { data: newRegion, error: regionError } = await supabase
          .from("coverage_regions")
          .insert({ name: regionName, display_order: displayOrder })
          .select("id")
          .single();

        if (regionError) {
          console.error(`Error creating region ${regionName}:`, regionError);
          continue;
        }
        region = newRegion;
        results.regions.push(regionName);
      }

      // Create a "General" borough for each region
      const { data: borough, error: boroughError } = await supabase
        .from("coverage_boroughs")
        .insert({ 
          region_id: region.id, 
          name: "General",
          display_order: 1
        })
        .select("id")
        .single();

      if (boroughError) {
        console.error(`Error creating borough for ${regionName}:`, boroughError);
        continue;
      }
      results.boroughs.push(`${regionName} - General`);

      // Add postcodes
      const postcodeRecords = postcodes.map(prefix => ({
        borough_id: borough.id,
        prefix: prefix,
        domestic_cleaning: true,
        airbnb_cleaning: true,
        end_of_tenancy: true,
        is_active: true
      }));

      const { error: postcodeError } = await supabase
        .from("postcode_prefixes")
        .insert(postcodeRecords);

      if (postcodeError) {
        console.error(`Error creating postcodes for ${regionName}:`, postcodeError);
      } else {
        results.postcodes.push(...postcodes);
      }

      displayOrder++;
    }

    // Delete unused regions
    await supabase.from("coverage_regions").delete().in("name", ["Essex", "Kent", "Hertfordshire"]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Coverage data seeded successfully",
        created: {
          regions: results.regions.length,
          boroughs: results.boroughs.length,
          postcodes: results.postcodes.length
        }
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
