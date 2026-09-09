import { createRouter } from '@tanstack/react-router';
import { authedRoute, indexRoute, rootRoute } from './router-base';
import { loginRoute } from './routes/auth/login';
import { signupRoute } from './routes/auth/signup';
import { forgotPasswordRoute } from './routes/auth/forgot-password';
import { resetPasswordRoute } from './routes/auth/reset-password';
import { authCallbackRoute } from './routes/auth/callback';
import { todayRoute } from './routes/today';
import { mouthRoute } from './routes/mouth';
import { insightsRoute } from './routes/insights';
import { historyRoute } from './routes/history';
import { settingsRoute } from './routes/settings';
import { soreNewRoute } from './routes/sore-new';
import { soreDetailRoute } from './routes/sore-detail';
import { onboardingRoute } from './routes/onboarding';
import { NotFound } from './components/not-found';

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  authCallbackRoute,
  authedRoute.addChildren([
    todayRoute,
    mouthRoute,
    insightsRoute,
    historyRoute,
    settingsRoute,
    soreNewRoute,
    soreDetailRoute,
    onboardingRoute
  ])
]);

export const router = createRouter({
  routeTree,
  context: { auth: undefined! },
  defaultPreload: 'intent',
  defaultNotFoundComponent: NotFound,
  scrollRestoration: true
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
