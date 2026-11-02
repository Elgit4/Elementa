/**
 * Short hand-written notes for a few common elements.
 * Draft content: not yet reviewed by a chemistry teacher. Elements not listed here show data-derived
 * information only, rather than invented text.
 */
export interface Highlight { uses: string; occurrence: string }

export const HIGHLIGHTS: Record<string, Highlight> = {
  H: { uses: 'Used to make ammonia for fertilisers, and as a fuel.', occurrence: 'Found in water and in almost all compounds of living things. The most abundant element in the universe.' },
  He: { uses: 'Fills balloons and airships because it is light and does not burn. Used to cool MRI magnets.', occurrence: 'Collected from natural gas deposits.' },
  Li: { uses: 'Used in rechargeable batteries.', occurrence: 'Found in minerals and brines, always combined with other elements.' },
  C: { uses: 'The basis of organic chemistry and fuels. Graphite is used in pencils and electrodes; diamond in cutting tools and jewellery.', occurrence: 'Found in all living things, in carbon dioxide, limestone and fossil fuels.' },
  N: { uses: 'Used to make ammonia and fertilisers.', occurrence: 'About 78% of the air by volume, as the gas N₂.' },
  O: { uses: 'Needed for respiration and burning. Used in steel-making and hospitals.', occurrence: 'About 21% of air by volume, and the most abundant element in the Earth’s crust by mass, mostly in oxides and silicates.' },
  Ne: { uses: 'Glows red-orange in electric signs.', occurrence: 'A trace gas in air.' },
  Na: { uses: 'Sodium compounds are used in soap, glass and food (table salt is sodium chloride).', occurrence: 'Found in sea water and rock salt as sodium chloride. The free metal is never found in nature.' },
  Mg: { uses: 'Used in light alloys. Burns with a bright white flame, used in flares.', occurrence: 'Found in sea water and minerals such as magnesite. Part of chlorophyll in green plants.' },
  Al: { uses: 'Used for aircraft, drink cans, cooking foil and overhead cables because it is light and resists corrosion.', occurrence: 'The most abundant metal in the Earth’s crust. Extracted from bauxite by electrolysis. Ghana has bauxite deposits.' },
  Si: { uses: 'Silicon chips for electronics, and glass and cement as silicon dioxide.', occurrence: 'The second most abundant element in the crust, as sand and quartz (silicon dioxide).' },
  S: { uses: 'Used to make sulfuric acid, which is used in fertilisers, batteries and detergents.', occurrence: 'Found near volcanoes, in sulfide ores and in crude oil.' },
  Cl: { uses: 'Used to disinfect water and to make bleach and plastics such as PVC.', occurrence: 'Found in sea water and rock salt as chloride ions. The free gas is poisonous.' },
  K: { uses: 'Potassium compounds are used in fertilisers.', occurrence: 'Found in minerals and sea water as potassium ions. The free metal is never found in nature.' },
  Ca: { uses: 'Calcium carbonate is used in cement and building stone. Calcium compounds help form bones and teeth.', occurrence: 'Found in limestone, chalk, marble and sea shells.' },
  Fe: { uses: 'Made into steel for buildings, bridges, vehicles and tools. Rusts when exposed to air and water.', occurrence: 'Extracted from ores such as haematite in a blast furnace. Iron is the main element in the Earth’s core.' },
  Cu: { uses: 'Electrical wiring and water pipes, and alloys such as brass and bronze.', occurrence: 'Extracted from copper ores. Occasionally found as the free metal.' },
  Zn: { uses: 'Coats iron to stop it rusting (galvanising). Used in brass and batteries.', occurrence: 'Extracted from zinc blende (zinc sulfide).' },
  Ag: { uses: 'Jewellery, coins and electronics. The best electrical conductor of all metals.', occurrence: 'Found with other metals’ ores, and sometimes as the free metal.' },
  Au: { uses: 'Jewellery, coins and electronics. Very unreactive, so it does not tarnish.', occurrence: 'Found as the free metal. Gold mining is a major industry in Ghana.' },
  Hg: { uses: 'Used in some thermometers and lamps. It is toxic.', occurrence: 'Extracted from cinnabar (mercury sulfide). Liquid at room temperature.' },
  Pb: { uses: 'Used in car batteries and for radiation shielding. It is toxic.', occurrence: 'Extracted from galena (lead sulfide).' },
  U: { uses: 'Uranium-235 is used as nuclear reactor fuel.', occurrence: 'Found in minerals such as uraninite. All isotopes are radioactive.' },
};
