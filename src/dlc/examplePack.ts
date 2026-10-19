/** Sample pack shipped with the game to show the manifest format (see docs/GAME_RULES.md). */
export const EXAMPLE_PACK = {
  format: 1,
  id: 'forge-boreale',
  name: 'Forge boréale (exemple)',
  version: '1.0.0',
  author: 'Sento Seiya',
  description: 'Pack d’exemple : deux objets forgés dans les glaces du Nord. Les musiques se déclarent dans « music ».',
  items: [
    { id: 'anneau-de-givre', name: 'Anneau de givre', slot: 'relic', cost: 30, description: 'Un anneau de glace éternelle.', bonus: { attack: 1, defense: 1 } },
    { id: 'rune-boreale', name: 'Rune boréale', slot: 'charm', cost: 30, description: 'Gravée sous les aurores du Nord.', bonus: { hp: 6, maxCosmos: 1 } },
  ],
  music: {},
}
