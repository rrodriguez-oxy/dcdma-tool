import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component')
      .then(m => m.HomeComponent)
  },
  {
    path: 'project-site-well-movement',
    loadComponent: () => import('./features/project-site-well-movement/project-site-well-movement.component')
      .then(m => m.ProjectSiteWellMovementComponent)
  },
  {
    path: 'move-reports-engineering-data',
    loadComponent: () => import('./features/move-reports-engineering-data/move-reports-engineering-data.component')
      .then(m => m.MoveReportsEngineeringDataComponent)
  },
  {
    path: 'move-reports-between-events',
    loadComponent: () => import('./features/move-reports-between-events/move-reports-between-events.component')
      .then(m => m.MoveReportsBetweenEventsComponent)
  },
  {
    path: 'update-well-elevations',
    loadComponent: () => import('./features/update-well-elevations/update-well-elevations.component')
      .then(m => m.UpdateWellElevationsComponent)
  }
];
