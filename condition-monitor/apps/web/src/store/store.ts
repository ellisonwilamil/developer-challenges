import {
  combineReducers,
  configureStore,
  createListenerMiddleware,
  isRejected,
} from '@reduxjs/toolkit';
import { healthSlice } from '../features/health/health-slice';
import {
  fetchSession,
  login,
  sessionExpired,
  sessionSlice,
} from '../features/session/session-slice';

/** One slice per domain area (ADR 0005); each feature slice adds its reducer here. */
const rootReducer = combineReducers({
  [healthSlice.name]: healthSlice.reducer,
  [sessionSlice.name]: sessionSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/**
 * Any request answered 401 means the session is over, for example because it expired.
 * Handled here once, instead of in every thunk. Login and the session check are left out:
 * for them a 401 is an expected answer, not an expiry.
 */
function createSessionListener() {
  const listener = createListenerMiddleware();
  listener.startListening({
    predicate: (action) =>
      isRejected(action) &&
      action.error.code === '401' &&
      !login.rejected.match(action) &&
      !fetchSession.rejected.match(action),
    effect: (_action, api) => {
      api.dispatch(sessionExpired());
    },
  });
  return listener.middleware;
}

/** A factory, so each test gets a fresh store with the state it needs. */
export function createStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().prepend(createSessionListener()),
  });
}

export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore['dispatch'];
