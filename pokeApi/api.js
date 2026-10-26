const API_BASE_URL = "https://pokeapi.co/api/v2";

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`PokeAPI request failed (${response.status}): ${url}`);
    }

    return response.json();
}

async function getAllPokemons() {
    const results = [];
    let nextUrl = `${API_BASE_URL}/pokemon?limit=1000`;
    let count = 0;

    while (nextUrl) {
        const page = await fetchJson(nextUrl);
        count = page.count;
        results.push(...page.results);
        nextUrl = page.next;
    }

    return { count, next: null, previous: null, results };
}

function getPokemonById(id) {
    return fetchJson(`${API_BASE_URL}/pokemon/${encodeURIComponent(id)}`);
}

function getPokemonsAbility(abilityName) {
    return fetchJson(`${API_BASE_URL}/ability/${encodeURIComponent(abilityName)}`);
}

function getPokemonType(typeName) {
    return fetchJson(`${API_BASE_URL}/type/${encodeURIComponent(typeName)}`);
}

async function getPokemonAbility(id, abilityName) {
    const [pokemon, abilityDetails] = await Promise.all([
        getPokemonById(id),
        getPokemonsAbility(abilityName)
    ]);
    const pokemonAbility = pokemon.abilities.find(
        (entry) => entry.ability.name.toLowerCase() === String(abilityName).toLowerCase()
    );

    if (!pokemonAbility) {
        throw new Error(`Pokémon ${pokemon.name} does not have the ability "${abilityName}"`);
    }

    return {
        pokemon: { id: pokemon.id, name: pokemon.name },
        ability: pokemonAbility.ability,
        slot: pokemonAbility.slot,
        is_hidden: pokemonAbility.is_hidden,
        details: abilityDetails
    };
}

function getPokemonSpecies(url) {
    return fetchJson(url);
}

export {
    getAllPokemons,
    getPokemonById,
    getPokemonsAbility,
    getPokemonType,
    getPokemonAbility,
    getPokemonSpecies
};
