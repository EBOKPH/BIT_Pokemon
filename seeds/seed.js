import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

async function seedPokemon(startId = 1, endId = 649) {
  for (let id = startId; id <= endId; id++) {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const p = await res.json();

      console.log(`Seeding Pokémon #${id}: ${p.name}`);

      // Insert into pokemons table
      const { data: pokemonRow, error: pokemonErr } = await supabase
        .from("pokemons")
        .insert([
          {
            pokedex_no: p.id,
            name: p.name,
            base_hp: p.stats[0].base_stat,
            base_attack: p.stats[1].base_stat,
            base_defense: p.stats[2].base_stat,
            base_sp_attack: p.stats[3].base_stat,
            base_sp_defense: p.stats[4].base_stat,
            base_speed: p.stats[5].base_stat,
            height: p.height,
            weight: p.weight,
          },
        ])
        .select()
        .single();

      if (pokemonErr) {
        console.error("Pokemon insert error:", pokemonErr.message);
        continue;
      }

      const pokemon_id = pokemonRow.pokemon_id;

      // Insert types
      for (const t of p.types) {
        const typeName = t.type.name;

        // Get type_id from types table
        const { data: typeRow } = await supabase
          .from("types")
          .select("type_id")
          .eq("type_name", typeName)
          .single();

        if (typeRow) {
          await supabase.from("pokemon_types").insert([
            {
              pokemon_id,
              type_id: typeRow.type_id,
            },
          ]);
        }
      }

      // Insert moves (only level-up moves)
      for (const m of p.moves) {
        const levelUp = m.version_group_details.find(
          (v) => v.move_learn_method.name === "level-up",
        );

        if (!levelUp) continue;

        const moveName = m.move.name;

        // Ensure move exists in moves table
        let { data: moveRow } = await supabase
          .from("moves")
          .select("move_id")
          .eq("name", moveName)
          .single();

        if (!moveRow) {
          // Fetch move details
          const moveRes = await fetch(m.move.url);
          const moveData = await moveRes.json();

          const typeName = moveData.type.name;

          const { data: typeRow } = await supabase
            .from("types")
            .select("type_id")
            .eq("type_name", typeName)
            .single();

          const { data: newMove } = await supabase
            .from("moves")
            .insert([
              {
                name: moveData.name,
                type_id: typeRow?.type_id || null,
                power: moveData.power,
                accuracy: moveData.accuracy,
                pp: moveData.pp,
                damage_class: moveData.damage_class.name,
              },
            ])
            .select()
            .single();

          moveRow = newMove;
        }

        // Insert into pokemon_moves
        await supabase.from("pokemon_moves").insert([
          {
            pokemon_id,
            move_id: moveRow.move_id,
            learn_level: levelUp.level_learned_at,
          },
        ]);
      }
    } catch (err) {
      console.error(`Error on Pokémon ${id}:`, err);
    }
  }

  console.log("DONE SEEDING GEN 1–5!");
}

seedPokemon();
