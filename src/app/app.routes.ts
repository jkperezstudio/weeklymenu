import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dailyview',
    pathMatch: 'full',
  },
  /*
  {
    path: '',
    redirectTo: 'folder/inbox',
    pathMatch: 'full',
  },
  {
    path: 'folder/:id',
    loadComponent: () =>
      import('./folder/folder.page').then((m) => m.FolderPage),
  },
  */
  {
    path: 'dailyview',
    loadComponent: () => import('./pages/dailyview/dailyview.page').then(m => m.DailyviewPage)
  },
  {
    path: 'dailyview/:day',
    loadComponent: () => import('./pages/dailyview/dailyview.page').then(m => m.DailyviewPage)
  },
  {
    path: 'weeklyview',
    loadComponent: () => import('./pages/weeklyview/weeklyview.page').then(m => m.WeeklyviewPage)
  },
  {
    path: 'monthlyview',
    loadComponent: () => import('./pages/monthlyview/monthlyview.page').then(m => m.MonthlyViewPage)

  },
  {
    path: 'mealform',
    loadComponent: () => import('./pages/mealform/mealform.page').then(m => m.MealformPage)
  },
  {
    path: 'mealform/:id',
    loadComponent: () => import('./pages/mealform/mealform.page').then(m => m.MealformPage)
  },
  {
    path: 'mealdb',
    loadComponent: () => import('./pages/mealdb/mealdb.page').then(m => m.MealdbPage)
  },
  {
    path: 'stats',
    loadComponent: () => import('./pages/stats/stats.page').then(m => m.StatsPage)
  },
  {
    path: 'config',
    loadComponent: () => import('./pages/config/config.page').then(m => m.ConfigPage)
  },
  {
    path: 'checkbox-test',
    loadComponent: () => import('./pages/checkbox-test/checkbox-test.page').then(m => m.CheckboxTestPage)
  },
];
