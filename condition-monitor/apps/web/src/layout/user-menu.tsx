import LogoutIcon from '@mui/icons-material/Logout';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router';
import { logout } from '../features/session/session-slice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

/** Who is logged in, and the way out. The email is hidden on narrow screens. */
export function UserMenu() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const email = useAppSelector((state) => state.session.user?.email);

  const onLogout = async () => {
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <>
      <Typography
        variant="body2"
        component="span"
        sx={{ display: { xs: 'none', sm: 'inline' }, mx: 2 }}
      >
        {email}
      </Typography>
      <Button color="inherit" startIcon={<LogoutIcon />} onClick={() => void onLogout()}>
        Log out
      </Button>
    </>
  );
}
