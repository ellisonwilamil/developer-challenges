import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createStore } from '../store/store';
import { routes } from './routes';
import { theme } from './theme';

/** jsdom has no layout engine; the screen width is declared through matchMedia. */
function setScreen(width: 'wide' | 'narrow') {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: width === 'wide',
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function renderAt(path: string) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })));
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <Provider store={createStore()}>
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>,
  );
}

const SCREENS = ['Overview', 'Sectors', 'Machines', 'Monitoring points', 'CSV import'];

describe('application routes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps every screen in a visible menu on a wide screen', () => {
    setScreen('wide');
    renderAt('/');

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    for (const label of SCREENS) {
      expect(nav).toHaveTextContent(label);
    }
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
  });

  it('hides the menu behind a button on a narrow screen', () => {
    setScreen('narrow');
    renderAt('/');

    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('renders the screen of the current path', () => {
    setScreen('wide');
    renderAt('/machines');

    expect(screen.getByRole('heading', { name: 'Machines' })).toBeInTheDocument();
  });

  it('answers an unknown path with a not found page', () => {
    setScreen('wide');
    renderAt('/no-such-screen');

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('shows the API as online once the health check answers', async () => {
    setScreen('wide');
    renderAt('/');

    expect(await screen.findByText('API: online')).toBeInTheDocument();
  });
});
