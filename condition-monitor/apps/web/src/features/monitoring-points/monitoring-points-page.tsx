import { locationLabel, type PointSortKey } from '@condition-monitor/shared';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPoints, type PointsQuery } from './monitoring-points-slice';

/** The four columns the challenge requires first, then the tag and the position. */
const COLUMNS: { key: PointSortKey; label: string }[] = [
  { key: 'machineName', label: 'Machine Name' },
  { key: 'machineType', label: 'Machine Type' },
  { key: 'monitoringPointName', label: 'Monitoring Point Name' },
  { key: 'sensorModel', label: 'Sensor Model' },
  { key: 'machineTag', label: 'Tag' },
  { key: 'location', label: 'Position' },
];

/**
 * Every monitoring point of the user, 5 per page, sortable by any column in both
 * directions (challenge, section 3). Points without a sensor sort last either way (B7).
 * A row opens its machine, where its sensor is managed.
 */
export function MonitoringPointsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { query, page, status, error } = useAppSelector((state) => state.monitoringPoints);

  const load = useCallback(
    (changes: Partial<PointsQuery>) => dispatch(fetchPoints({ ...query, ...changes })),
    [dispatch, query],
  );

  useEffect(() => {
    void dispatch(fetchPoints(query));
    // Loads once per visit; later changes go through `load`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const sort = (key: PointSortKey) =>
    void load({
      sort: key,
      order: query.sort === key && query.order === 'asc' ? 'desc' : 'asc',
      page: 1,
    });

  return (
    <>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        Monitoring points
      </Typography>

      {status === 'failed' && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void load({})}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {status !== 'failed' && !page && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress aria-label="Loading monitoring points" />
        </Box>
      )}
      {page && page.total === 0 && status !== 'failed' && (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">
            No monitoring points yet.{' '}
            <Link component={RouterLink} to="/machines">
              Open a machine
            </Link>{' '}
            to add the positions where sensors are mounted.
          </Typography>
        </Paper>
      )}
      {page && page.total > 0 && (
        <Paper>
          <TableContainer>
            <Table aria-label="Monitoring points">
              <TableHead>
                <TableRow>
                  {COLUMNS.map((column) => (
                    <TableCell
                      key={column.key}
                      sortDirection={query.sort === column.key ? query.order : false}
                    >
                      <TableSortLabel
                        active={query.sort === column.key}
                        direction={query.sort === column.key ? query.order : 'asc'}
                        onClick={() => sort(column.key)}
                      >
                        {column.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {page.items.map((point) => (
                  <TableRow
                    key={point.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/machines/${point.machine.id}`)}
                  >
                    <TableCell>{point.machine.name}</TableCell>
                    <TableCell>{point.machine.type}</TableCell>
                    <TableCell>{point.name}</TableCell>
                    <TableCell>
                      {point.sensor?.model ?? (
                        <Typography component="span" variant="body2" color="text.secondary">
                          No sensor
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {/* The link keeps the row reachable by keyboard and screen readers. */}
                      <Link
                        component={RouterLink}
                        to={`/machines/${point.machine.id}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {point.machine.tag}
                      </Link>
                    </TableCell>
                    <TableCell>{locationLabel(point.location)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={page.total}
            page={query.page - 1}
            rowsPerPage={query.pageSize}
            rowsPerPageOptions={[5, 10, 25]}
            onPageChange={(_event, zeroBased) => void load({ page: zeroBased + 1 })}
            onRowsPerPageChange={(event) =>
              void load({ pageSize: Number(event.target.value), page: 1 })
            }
          />
        </Paper>
      )}
    </>
  );
}
