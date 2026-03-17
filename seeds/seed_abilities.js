import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

async function seedAbilities(startId = 1, endId = 649) {
  for (let id = startId; id <= endId; id++) {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const p = await res.json();

      console.log(`Abilities for #${id}: ${p.name}`);

      for (const a of p.abilities) {
        const abilityRes = await fetch(a.ability.url);
        const abilityData = await abilityRes.json();

        // Insert ability
        const { data: abilityRow } = await supabase
          .from("abilities")
          .upsert(
            {
              name: abilityData.name,
              effect: abilityData.effect_entries?.[0]?.effect || null,
              short_effect:
                abilityData.effect_entries?.[0]?.short_effect || null,
            },
            { onConflict: "name" },
          )
          .select()
          .single();

        // Insert pokemon_abilities
        await supabase.from("pokemon_abilities").upsert({
          pokemon_id: id,
          ability_id: abilityRow.ability_id,
          slot: a.slot,
          is_hidden: a.is_hidden,
        });
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }

  console.log("DONE SEEDING ABILITIES");
}

seedAbilities();
