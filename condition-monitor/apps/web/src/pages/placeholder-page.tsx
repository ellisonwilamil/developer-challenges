import Typography from '@mui/material/Typography';

/**
 * Stands in for a screen until its feature slice lands, so the navigation can be built
 * and tested now. Each slice replaces one of these with the real screen.
 */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <Typography variant="h5" component="h1" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary">
        This screen arrives with its feature, connected to the API.
      </Typography>
    </>
  );
}
