import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

async function seedSpecies(startId = 1, endId = 649) {
  for (let id = startId; id <= endId; id++) {
    try {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${id}`,
      );
      const s = await res.json();

      await supabase.from("pokemon_species").upsert({
        pokemon_id: id,
        color: s.color?.name || null,
        shape: s.shape?.name || null,
        habitat: s.habitat?.name || null,
        capture_rate: s.capture_rate,
        base_happiness: s.base_happiness,
        gender_rate: s.gender_rate,
        hatch_steps: s.hatch_counter,
      });

      console.log(`Species: ${s.name}`);
    } catch (err) {
      console.log("Species error:", err);
    }
  }

  console.log("DONE SEEDING SPECIES");
}

seedSpecies();
