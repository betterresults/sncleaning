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

    // Define coverage data - updated list
    const coverageData = {
      "Central London": ["EC1", "EC2", "EC3", "EC4", "WC1", "WC2", "W1", "SW1"],
      "North London": ["N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8", "N9", "N10", "N11", "N12", "N13", "N14", "N15", "N16", "N17", "N18", "N19", "N20", "N21", "N22"],
      "East London": ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17", "E18", "E20"],
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
        "DA5", "DA6", "DA7", "DA14", "DA15", "DA16", "DA17"
      ],
      "Romford / East Essex": ["RM1", "RM2", "RM3", "RM4", "RM5", "RM6", "RM7", "RM8", "RM9", "RM10", "RM11", "RM12", "RM13", "RM14", "RM15", "RM16"],
      "Redbridge / Ilford": ["IG1", "IG2", "IG3", "IG4", "IG5", "IG6", "IG7", "IG8", "IG9"],
      "Enfield / Herts Edge": ["EN1", "EN2", "EN3", "EN4", "EN5", "EN6", "EN7", "EN8", "EN9"],
      "Basildon (Essex)": ["SS13", "SS14", "SS15", "SS16"],
      "Other Essex": ["SS0", "SS1", "SS2", "SS3", "SS4", "SS5", "SS6", "SS7", "SS8", "SS9", "CM1", "CM2", "CM3", "CM7", "CM8", "CM9", "CM13", "CM14", "CM15"],
      "Sheffield": ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S17", "S18", "S20", "S21", "S25", "S26"]
    };

    const results: any = { regions: [], boroughs: [], postcodes: [] };

    // Delete all existing data to start fresh
    console.log("Deleting existing data...");
    await supabase.from("postcode_prefixes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("coverage_boroughs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("coverage_regions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Process each region
    let displayOrder = 1;
    for (const [regionName, postcodes] of Object.entries(coverageData)) {
      console.log(`Creating region: ${regionName}`);
      
      // Create region
      const { data: region, error: regionError } = await supabase
        .from("coverage_regions")
        .insert({ name: regionName, display_order: displayOrder })
        .select("id")
        .single();

      if (regionError) {
        console.error(`Error creating region ${regionName}:`, regionError);
        continue;
      }
      results.regions.push(regionName);

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
        console.log(`Added ${postcodes.length} postcodes to ${regionName}`);
      }

      displayOrder++;
    }

    console.log("Coverage data seeding complete!");

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
