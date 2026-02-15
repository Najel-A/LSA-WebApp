import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setRole, type UserRole } from '@/features/auth/authSlice';

/** Dev-only: toggle current user role between "user" and "admin" for demo. */
export function DevRoleToggle() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  if (import.meta.env.PROD || !user) return null;

  const nextRole: UserRole = user.role === 'admin' ? 'user' : 'admin';

  return (
    <button
      type="button"
      onClick={() => dispatch(setRole(nextRole))}
      className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
      title="Dev only: toggle role for demo"
    >
      Role: {user.role} → {nextRole}
    </button>
  );
}
