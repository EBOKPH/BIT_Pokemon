import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

async function seedEvolutions() {
  for (let chainId = 1; chainId <= 500; chainId++) {
    try {
      const res = await fetch(
        `https://pokeapi.co/api/v2/evolution-chain/${chainId}`,
      );
      if (!res.ok) continue;

      const chain = await res.json();

      const baseName = chain.chain.species.name;

      // Insert chain
      const { data: basePokemon } = await supabase
        .from("pokemons")
        .select("pokemon_id")
        .eq("name", baseName)
        .single();

      if (!basePokemon) continue;

      const { data: chainRow } = await supabase
        .from("evolution_chains")
        .insert({ base_pokemon_id: basePokemon.pokemon_id })
        .select()
        .single();

      // Recursive evolution walker
      async function walk(node) {
        for (const evo of node.evolves_to) {
          const fromName = node.species.name;
          const toName = evo.species.name;

          const { data: fromRow } = await supabase
            .from("pokemons")
            .select("pokemon_id")
            .eq("name", fromName)
            .single();

          const { data: toRow } = await supabase
            .from("pokemons")
            .select("pokemon_id")
            .eq("name", toName)
            .single();

          if (fromRow && toRow) {
            await supabase.from("evolutions").insert({
              from_pokemon_id: fromRow.pokemon_id,
              to_pokemon_id: toRow.pokemon_id,
              trigger: evo.evolution_details[0]?.trigger?.name || null,
              min_level: evo.evolution_details[0]?.min_level || null,
              item: evo.evolution_details[0]?.item?.name || null,
              time_of_day: evo.evolution_details[0]?.time_of_day || null,
              happiness: evo.evolution_details[0]?.min_happiness || null,
              gender: evo.evolution_details[0]?.gender || null,
              held_item: evo.evolution_details[0]?.held_item?.name || null,
            });
          }

          await walk(evo);
        }
      }

      await walk(chain.chain);
    } catch (err) {
      console.log("Chain error:", err);
    }
  }

  console.log("DONE SEEDING EVOLUTIONS");
}

seedEvolutions();
