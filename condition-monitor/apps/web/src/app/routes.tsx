import type { ReactElement } from 'react';
import type { RouteObject } from 'react-router';
import { ImportPage } from '../features/import/import-page';
import { MachineDetailPage } from '../features/machine-detail/machine-detail-page';
import { MachinesPage } from '../features/machines/machines-page';
import { MonitoringPointsPage } from '../features/monitoring-points/monitoring-points-page';
import { OverviewPage } from '../features/overview/overview-page';
import { SectorsPage } from '../features/sectors/sectors-page';
import { RequireSession } from '../features/session/require-session';
import { AppLayout } from '../layout/app-layout';
import { NAVIGATION } from '../layout/navigation';
import { LoginPage } from '../pages/login-page';
import { NotFoundPage } from '../pages/not-found-page';

/** The screen of each menu entry; the type makes a missing one a compile error. */
const SCREENS: Record<(typeof NAVIGATION)[number]['path'], ReactElement> = {
  '/': <OverviewPage />,
  '/sectors': <SectorsPage />,
  '/machines': <MachinesPage />,
  '/monitoring-points': <MonitoringPointsPage />,
  '/import': <ImportPage />,
};

/**
 * Route table, kept apart from the router so tests can mount it in memory. Only the login
 * screen is public; everything else waits for a confirmed session.
 */
export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireSession />,
    children: [
      {
        element: <AppLayout />,
        children: [
          ...NAVIGATION.map((item) => ({
            path: item.path,
            element: SCREENS[item.path],
          })),
          { path: '/machines/:id', element: <MachineDetailPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
