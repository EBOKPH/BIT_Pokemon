import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

async function seedEggGroups(startId = 1, endId = 649) {
  for (let id = startId; id <= endId; id++) {
    try {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${id}`,
      );
      const s = await res.json();

      for (const g of s.egg_groups) {
        const { data: groupRow } = await supabase
          .from("egg_groups")
          .upsert({ name: g.name }, { onConflict: "name" })
          .select()
          .single();

        await supabase.from("pokemon_egg_groups").upsert({
          pokemon_id: id,
          egg_group_id: groupRow.egg_group_id,
        });
      }

      console.log(`Egg groups: ${s.name}`);
    } catch (err) {
      console.log("Egg group error:", err);
    }
  }

  console.log("DONE SEEDING EGG GROUPS");
}

seedEggGroups();
