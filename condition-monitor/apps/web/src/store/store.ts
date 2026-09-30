import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { healthSlice } from '../features/health/health-slice';

/** One slice per domain area (ADR 0005); each feature slice adds its reducer here. */
const rootReducer = combineReducers({
  [healthSlice.name]: healthSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/** A factory, so each test gets a fresh store with the state it needs. */
export function createStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore['dispatch'];
