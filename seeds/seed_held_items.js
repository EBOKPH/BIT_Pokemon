import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

async function seedHeldItems(startId = 1, endId = 649) {
  for (let id = startId; id <= endId; id++) {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const p = await res.json();

      for (const item of p.held_items) {
        await supabase.from("pokemon_held_items").upsert({
          pokemon_id: id,
          item_name: item.item.name,
          rarity: item.version_details[0]?.rarity || null,
        });
      }

      console.log(`Held items: ${p.name}`);
    } catch (err) {
      console.log("Held item error:", err);
    }
  }

  console.log("DONE SEEDING HELD ITEMS");
}

seedHeldItems();
