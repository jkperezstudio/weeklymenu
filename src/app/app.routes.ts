import { Routes } from '@angular/router';

export const routes: Routes = [
  // Cuando entras a la app, redirige a /tabs/daily
  {
    path: '',
    redirectTo: '/tabs/daily',
    pathMatch: 'full',
  },

  // Esta es la definición del layout de tabs
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'daily',
        loadComponent: () =>
          import('./pages/dailyview/dailyview.page').then((m) => m.DailyViewPage),
      },
      {
        path: 'daily/:day',
        loadComponent: () =>
          import('./pages/dailyview/dailyview.page').then((m) => m.DailyViewPage),
      },
      {
        path: 'monthly',
        loadComponent: () =>
          import('./pages/monthlyview/monthlyview.page').then((m) => m.MonthlyViewPage),
      },
      {
        path: 'database', // <--- Aquí cargas mealdb.page, renombrado a "database"
        loadComponent: () =>
          import('./pages/mealdb/mealdb.page').then((m) => m.MealDbPage),
      },
      {
        path: '',
        redirectTo: 'daily',
        pathMatch: 'full',
      },
    ],
  },

  // Rutas extra que **no** van en el tab-menu
  {
    path: 'weeklyview',
    loadComponent: () =>
      import('./pages/weeklyview/weeklyview.page').then((m) => m.WeeklyviewPage),
  },
  {
    path: 'mealform',
    loadComponent: () =>
      import('./pages/mealform/mealform.page').then((m) => m.MealFormPage),
  },
  {
    path: 'mealform/:id',
    loadComponent: () =>
      import('./pages/mealform/mealform.page').then((m) => m.MealFormPage),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./pages/stats/stats.page').then((m) => m.StatsPage),
  },
  {
    path: 'config',
    loadComponent: () =>
      import('./pages/config/config.page').then((m) => m.ConfigPage),
  },
  {
    path: 'checkbox-test',
    loadComponent: () =>
      import('./pages/checkbox-test/checkbox-test.page').then((m) => m.CheckboxTestPage),
  },


];
