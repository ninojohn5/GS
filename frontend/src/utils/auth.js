import api from './api';

// ── Auth Helpers ─────────────────────────────────────────────────────────────
const SESSION_KEY = 'pms_session';

// ── Session ─────────────────────────────────────────────────────────────────
export function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  localStorage.setItem('role', user.role);
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('role');
}

// ── Role → route ────────────────────────────────────────────────────────────
export function dashboardRoute(role) {
  const routes = {
    researcher:         "/researcher/dashboard",
    evaluator:          "/evaluator/dashboard",
    admin:              "/admin/dashboard",
    rde_division_chief: "/approver/dashboard",
    campus_director:    "/approver/dashboard",
    vprie:              "/approver/dashboard",
    president:          "/approver/dashboard",
  };
  return routes[role] || "/login";
}

// ── API Auth calls ──────────────────────────────────────────────────────────
export async function loginUser(email, password, role) {
  const response = await api.post('/login', { email, password, role });
  const { user, token } = response.data;

  setSession({ ...user, token });
  return user;
}

export async function registerUser(name, email, password, role, profile) {
  const response = await api.post('/register', {
    name,
    email,
    password,
    password_confirmation: password,
    role,

    department: profile?.department || null,
    position: profile?.position ? String(profile.position) : null,
    program:    profile?.program    || null,
  });

  const { user, token } = response.data;

  setSession({ ...user, token });
  return user;
}

export async function logoutUser() {
  try {
    await api.post('/logout');
  } finally {
    clearSession();
  }
}