// REMOVED: OAuth users go directly to dashboard
// No profile setup required - optional completion from settings
export default function GoogleUserSetup() {
  window.location.href = '/user-dashboard';
  return null;
}