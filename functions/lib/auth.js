/**
 * Cloud Function role-claim helper.
 * Used by callable Functions to verify the caller's custom claim role.
 */

const ALLOWED_ROLES = ['owner', 'admin_only', 'tech'];

function requireRole(context, allowed) {
  if (!context.auth) {
    const error = new Error('UNAUTHENTICATED');
    error.code = 'unauthenticated';
    throw error;
  }
  const role = context.auth.token && context.auth.token.role;
  if (!ALLOWED_ROLES.includes(role) || !allowed.includes(role)) {
    const error = new Error('PERMISSION_DENIED');
    error.code = 'permission-denied';
    throw error;
  }
  return role;
}

module.exports = { requireRole, ALLOWED_ROLES };
