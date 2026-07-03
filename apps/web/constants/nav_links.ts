export const nav_links = [
  { href: '#', label: 'Stream', key: 'stream' },
  { href: '/classwork', label: 'Classwork', key: 'classwork' },
  { href: '/people', label: 'People', key: 'people' },
];

export interface NavLink {
  href: string;
  key: string;
  label: string;
}
