import type { MapDemoPlace, MapDemoSubwayStation } from '@/types/mapDemo';

export const MAP_DEMO_CENTER: [number, number] = [-73.9915, 40.7412];

export const MAP_DEMO_HOTELS: MapDemoPlace[] = [
  {
    id: 'hotel-hilton-midtown',
    name: 'Hilton Midtown',
    category: 'hotel',
    coordinates: [-73.9776, 40.7614],
    neighborhood: 'Midtown',
    description: 'Classic Midtown base with fast access to Central Park, Fifth Avenue, and major subway connections.',
    nightlyRate: 429,
  },
  {
    id: 'hotel-gansevoort',
    name: 'Hotel Gansevoort',
    category: 'hotel',
    coordinates: [-74.0074, 40.7401],
    neighborhood: 'Meatpacking District',
    description: 'Downtown stay near the High Line, Whitney Museum, and riverfront walking routes.',
    nightlyRate: 518,
  },
  {
    id: 'hotel-marriott-union-square',
    name: 'Marriott Union Square',
    category: 'hotel',
    coordinates: [-73.9898, 40.7354],
    neighborhood: 'Union Square',
    description: 'Transit-heavy launch point with direct access to Union Square and Lower Manhattan itineraries.',
    nightlyRate: 388,
  },
  {
    id: 'hotel-standard-high-line',
    name: 'The Standard, High Line',
    category: 'hotel',
    coordinates: [-74.0058, 40.7426],
    neighborhood: 'Meatpacking District',
    description: 'Design-forward hotel anchored on the High Line with strong west side discovery potential.',
    nightlyRate: 612,
  },
];

export const MAP_DEMO_RESTAURANTS: MapDemoPlace[] = [
  {
    id: 'rest-via-carota',
    name: 'Via Carota',
    category: 'restaurant',
    coordinates: [-74.0029, 40.733],
    neighborhood: 'West Village',
    description: 'Flagship West Village lunch or dinner stop.',
  },
  {
    id: 'rest-don-angie',
    name: 'Don Angie',
    category: 'restaurant',
    coordinates: [-74.0014, 40.7373],
    neighborhood: 'West Village',
    description: 'High-demand dinner anchor for a downtown route.',
  },
  {
    id: 'rest-lilia',
    name: 'Lilia',
    category: 'restaurant',
    coordinates: [-73.9551, 40.7218],
    neighborhood: 'Williamsburg',
    description: 'A longer transit destination for a marquee food stop.',
  },
  {
    id: 'rest-cafe-integral',
    name: 'Cafe Integral',
    category: 'restaurant',
    coordinates: [-73.9973, 40.7221],
    neighborhood: 'Nolita',
    description: 'Coffee-first stop for a lighter morning route.',
  },
  {
    id: 'rest-prince-street-pizza',
    name: 'Prince Street Pizza',
    category: 'restaurant',
    coordinates: [-73.9966, 40.7237],
    neighborhood: 'Nolita / SoHo',
    description: 'Quick-service landmark for a casual NYC stop.',
  },
  {
    id: 'rest-russ-daughters',
    name: 'Russ & Daughters',
    category: 'restaurant',
    coordinates: [-73.987, 40.7217],
    neighborhood: 'Lower East Side',
    description: 'Classic Lower East Side food destination.',
  },
];

export const MAP_DEMO_ATTRACTIONS: MapDemoPlace[] = [
  {
    id: 'attr-high-line',
    name: 'The High Line',
    category: 'attraction',
    coordinates: [-74.0048, 40.7479],
    neighborhood: 'Chelsea / Meatpacking',
    description: 'Elevated linear park and a natural route spine.',
  },
  {
    id: 'attr-whitney',
    name: 'Whitney Museum',
    category: 'attraction',
    coordinates: [-74.0089, 40.7396],
    neighborhood: 'Meatpacking District',
    description: 'Major museum anchor for a culture-focused route.',
  },
  {
    id: 'attr-little-island',
    name: 'Little Island',
    category: 'attraction',
    coordinates: [-74.0094, 40.7448],
    neighborhood: 'West Village',
    description: 'Short scenic walk target along the Hudson edge.',
  },
  {
    id: 'attr-chelsea-market',
    name: 'Chelsea Market',
    category: 'attraction',
    coordinates: [-74.0047, 40.7424],
    neighborhood: 'Chelsea',
    description: 'Dense indoor discovery cluster for future multi-stop routes.',
  },
  {
    id: 'attr-hudson-yards',
    name: 'Hudson Yards',
    category: 'attraction',
    coordinates: [-74.0018, 40.7539],
    neighborhood: 'Hudson Yards',
    description: 'Northwest destination for a polished modern route.',
  },
  {
    id: 'attr-soho-shopping',
    name: 'SoHo Shopping',
    category: 'attraction',
    coordinates: [-74.0018, 40.7243],
    neighborhood: 'SoHo',
    description: 'Flexible retail and street-life destination.',
  },
];

export const MAP_DEMO_SUBWAY_STATIONS: MapDemoSubwayStation[] = [
  {
    id: 'sub-14-st-union-sq',
    name: '14 St-Union Sq',
    coordinates: [-73.9903, 40.7351],
    neighborhood: 'Union Square',
    servedLines: ['4', '5', '6', 'L', 'N', 'Q', 'R', 'W'],
  },
  {
    id: 'sub-34-st-herald-sq',
    name: '34 St-Herald Sq',
    coordinates: [-73.9877, 40.7495],
    neighborhood: 'Midtown',
    servedLines: ['B', 'D', 'F', 'M', 'N', 'Q', 'R', 'W'],
  },
  {
    id: 'sub-times-sq-42-st',
    name: 'Times Sq-42 St',
    coordinates: [-73.9868, 40.7557],
    neighborhood: 'Midtown',
    servedLines: ['1', '2', '3', '7', 'N', 'Q', 'R', 'W', 'S', 'A', 'C', 'E'],
  },
  {
    id: 'sub-w-4-st',
    name: 'W 4 St',
    coordinates: [-74.0002, 40.7324],
    neighborhood: 'West Village / Greenwich Village',
    servedLines: ['A', 'C', 'E', 'B', 'D', 'F', 'M'],
  },
  {
    id: 'sub-23-st',
    name: '23 St',
    coordinates: [-73.9911, 40.7411],
    neighborhood: 'Chelsea / Flatiron',
    servedLines: ['F', 'M'],
  },
  {
    id: 'sub-8-av',
    name: '8 Av',
    coordinates: [-74.0018, 40.7399],
    neighborhood: 'Chelsea',
    servedLines: ['A', 'C', 'E', 'L'],
  },
];
