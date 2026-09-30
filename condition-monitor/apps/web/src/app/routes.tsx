import type { RouteObject } from 'react-router';
import { AppLayout } from '../layout/app-layout';
import { NAVIGATION } from '../layout/navigation';
import { NotFoundPage } from '../pages/not-found-page';
import { PlaceholderPage } from '../pages/placeholder-page';

/**
 * Route table, kept apart from the router so tests can mount it in memory. The login
 * screen and the guard that makes these routes private arrive with authentication.
 */
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      ...NAVIGATION.map((item) => ({
        path: item.path,
        element: <PlaceholderPage title={item.label} />,
      })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
