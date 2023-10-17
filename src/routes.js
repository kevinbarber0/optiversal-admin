import {
  faLightbulb,
  faSlidersH,
  faBookOpen,
  faCopy,
  faEnvelopeOpen,
  faUsers,
  faTasks,
  faQuoteLeft,
} from '@fortawesome/free-solid-svg-icons';
import { UserRole } from '@util/enum';

export const routes = [
  {
    title: 'Pages',
    href: '/pages',
    icon: faCopy,
    roles: [UserRole.ViewPages],
  },
  {
    title: 'Ideas',
    href: '/ideas',
    icon: faLightbulb,
  },
  {
    title: 'Workflows',
    href: '/workflow',
    icon: faTasks,
    roles: [UserRole.ManageProductCopy],
  },
  {
    title: 'Catalog',
    href: '/catalog',
    icon: faBookOpen,
  },
  {
    title: 'Reviews',
    href: '/reviews',
    icon: faQuoteLeft,
  },
  {
    title: 'Manage Users',
    href: '/manage-users',
    icon: faUsers,
    roles: [UserRole.ManageUsers],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: faSlidersH,
    roles: [UserRole.ManageSettings],
  },
  {
    title: 'Contact',
    href: '/contact',
    icon: faEnvelopeOpen,
  },
];

export const hiddenRoutes = [
  {
    title: 'Create Page',
    href: '/page/add',
    roles: [UserRole.EditPages],
  },
  {
    title: 'View Account History',
    href: '/manage-users?view="history"',
    roles: [UserRole.ManageUsers],
  },
  {
    title: 'Tools',
    href: '/tools/auth0?view="connection"',
    roles: [UserRole.ManageUsers],
  },
];

export const getRouteRoles = (path) => {
  return (
    [...routes, ...hiddenRoutes].find((route) => route.href === path)?.roles ||
    null
  );
};
