import type { DemoRouteOption } from '@/types/mapDemo';

export const DEMO_ROUTE_OPTIONS: DemoRouteOption[] = [
  {
    id: 'food',
    label: 'Food',
    summary: 'Restaurant-first flow with quick handoffs to nearby subway nodes.',
    accent: '#f97316',
  },
  {
    id: 'scenic',
    label: 'Scenic',
    summary: 'Parks, river edges, and visually strong walking segments.',
    accent: '#10b981',
  },
  {
    id: 'chill',
    label: 'Chill',
    summary: 'Shorter hops, lower transit load, and clustered discovery.',
    accent: '#0ea5e9',
  },
  {
    id: 'explore',
    label: 'Explore',
    summary: 'Broader Manhattan coverage with more aggressive subway use.',
    accent: '#8b5cf6',
  },
];
