type SessionIdentity = { id?: unknown; nombre?: unknown };
type StoredUser = { id: string; nombre: string } | null;

export function isAllowedSession(identity: SessionIdentity, user: StoredUser) {
  return (
    typeof identity.id === "string" &&
    identity.nombre === "Diego" &&
    user?.id === identity.id &&
    user.nombre === "Diego"
  );
}
