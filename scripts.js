

import * as pokeApi from "./pokeApi/api.js";

const typeLabels = { all: "TODOS", planta: "PLANTA", fire: "FUEGO", water: "AGUA", electric: "ELECTRICO", psychic: "PSIQUICO", normal: "NORMAL", poison: "VENENO", ground: "TIERRA", flying: "VOLADOR", bug: "BICHO", rock: "ROCA", ghost: "FANTASMA", dragon: "DRAGON", ice: "HIELO", fighting: "LUCHA", steel: "ACERO", fairy: "HADA", dark: "SINIESTRO" };
const typeShortNames = { electric: "ELECTRICO", normal: "NORMAL", fire: "FUEGO", water: "AGUA", grass: "PLANTA", poison: "VENENO", ground: "TIERRA", flying: "VOLADOR", bug: "BICHO", rock: "ROCA", ghost: "FANTASMA", dragon: "DRAGON", ice: "HIELO", fighting: "LUCHA", steel: "ACERO", fairy: "HADA", dark: "SINIESTRO", psychic: "PSIQUICO" };
const statLabels = { hp: "PS (HP)", attack: "ATAQUE", "special-attack": "ATAQUE ESPECIAL", defense: "DEFENSA", "special-defense": "DEFENSA ESPECIAL", speed: "VELOCIDAD" };
let currentId = 1;
let currentPokemon;
let catalogRequestId = 0;

const $ = (selector) => document.querySelector(selector);
const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

function renderStats(stats) {
    $("#stats").innerHTML = stats.filter((stat) => statLabels[stat.stat.name]).map((stat) => `
        <div class="stat"><span>${statLabels[stat.stat.name]}</span><em class="stat-bar" aria-label="${stat.base_stat} de 100">${Array.from({ length: 20 }, (_, index) => `<i class="${index < Math.round(Math.min(stat.base_stat / 100, 1) * 20) ? "active" : ""}"></i>`).join("")}</em><b>${stat.base_stat}</b></div>`).join("");
}

function renderPokemonList(selector, items, formatItem) {
    const list = $(selector);
    list.replaceChildren();

    items.forEach((item) => {
        const entry = document.createElement("li");
        entry.textContent = formatItem(item);
        list.append(entry);
    });
}

async function renderPokemon(pokemon) {
    currentPokemon = pokemon;
    currentId = pokemon.id;
    const type = pokemon.types[0].type.name;
    $("#pokemon-image").src = pokemon.sprites.other["official-artwork"].front_default;
    $("#pokemon-image").alt = capitalize(pokemon.name);
    $("#screen-id").textContent = `#${String(pokemon.id).padStart(3, "0")} · ${pokemon.name.toUpperCase()}`;
    $("#pokemon-id").textContent = `#${String(pokemon.id).padStart(3, "0")}`;
    $("#pokemon-name").textContent = pokemon.name.toUpperCase();
    $("#pokemon-type").textContent = typeShortNames[type] || type.toUpperCase();
    $("#pokemon-height").textContent = `${pokemon.height / 10} m`;
    $("#pokemon-weight").textContent = `${pokemon.weight / 10} kg`;
    const species = await pokeApi.getPokemonSpecies(pokemon.species.url);
    const genus = species.genera.find((entry) => entry.language.name === "es") || species.genera.find((entry) => entry.language.name === "en");
    $("#pokemon-species").textContent = genus ? genus.genus : `Pokémon ${capitalize(pokemon.name)}`;
    $("#pokemon-description").textContent = `"Registro de campo: ${capitalize(pokemon.name)} destaca por sus capacidades de tipo ${capitalize(type)} y su comportamiento singular."`;
    renderStats(pokemon.stats);
    renderPokemonList("#pokemon-abilities", pokemon.abilities, ({ ability, is_hidden }) =>
        `${capitalize(ability.name.replaceAll("-", " "))}${is_hidden ? " (oculta)" : ""}`
    );
    renderPokemonList("#pokemon-moves", pokemon.moves, ({ move }) =>
        capitalize(move.name.replaceAll("-", " "))
    );
    $("#previous-pokemon").textContent = currentId > 1 ? `← #${String(currentId - 1).padStart(3, "0")}` : "← PRIMERO";
    $("#next-pokemon").textContent = currentId < 151 ? `#${String(currentId + 1).padStart(3, "0")} →` : "ÚLTIMO →";
    renderCatalog(currentId);
}

async function loadPokemon(value) {
    const query = String(value).trim().toLowerCase();
    if (!query) return;
    try {
        $("#pokemon-search").setCustomValidity("");
        await renderPokemon(await pokeApi.getPokemonById(query));
        $("#pokemon-search").value = query;
    } catch (error) {
        $("#pokemon-search").setCustomValidity("No se encontró ese Pokémon");
        $("#pokemon-search").reportValidity();
    }
}

function renderFilters() {
    $("#type-filters").innerHTML = Object.entries(typeLabels).map(([type, label]) => `<button type="button" data-type="${type}" class="btn btn-sm ${type === "all" ? "active" : ""}">${label}</button>`).join("");
    $("#type-filters").addEventListener("click", (event) => {
        if (event.target.tagName !== "BUTTON") return;
        document.querySelectorAll("#type-filters button").forEach((button) => button.classList.remove("active"));
        event.target.classList.add("active");
    });
}

async function renderCatalog(selectedId) {
    const requestId = ++catalogRequestId;
    const firstId = Math.max(1, Math.min(selectedId - 5, 1140));
    const pokemonIds = Array.from({ length: 12 }, (_, index) => firstId + index);
    const pokemons = await Promise.all(pokemonIds.map((id) => pokeApi.getPokemonById(id)));
    if (requestId !== catalogRequestId) return;
    $("#catalog-list").innerHTML = pokemons.map((pokemon) => `
        <button class="catalog-item col-12 col-sm-6 w-100 text-white border-0 ${pokemon.id === selectedId ? "selected" : ""}" data-id="${pokemon.id}" data-name="${pokemon.name}" type="button">
            <img alt="" src="${pokemon.sprites.front_default}"><span>#${String(pokemon.id).padStart(3, "0")} ${pokemon.name.toUpperCase()}</span><small>●</small>
        </button>`).join("");
}

function bindCatalog() {
    $("#catalog-list").addEventListener("click", (event) => {
        const item = event.target.closest(".catalog-item");
        if (item) loadPokemon(item.dataset.name);
    });
}

window.addEventListener("DOMContentLoaded", () => {
    renderFilters();
    bindCatalog();
    loadPokemon(currentId);
    $("#form1").addEventListener("submit", (event) => { event.preventDefault(); loadPokemon($("#pokemon-search").value); });
    $("#reset-search").addEventListener("click", () => loadPokemon(25));
    $("#previous-pokemon").addEventListener("click", () => { if (currentId > 1) loadPokemon(currentId - 1); });
    $("#next-pokemon").addEventListener("click", () => { if (currentId < 1351) loadPokemon(currentId + 1); });
});
