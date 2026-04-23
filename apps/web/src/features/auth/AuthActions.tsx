import { beginSignIn, signOut } from "./session";

type AuthActionsProps = {
  authenticated?: boolean;
};

export function AuthActions({ authenticated = false }: AuthActionsProps): JSX.Element {
  if (authenticated) {
    return (
      <button className="button button-secondary" onClick={() => void signOut()} type="button">
        Sign Out
      </button>
    );
  }

  return (
    <button className="button button-primary" onClick={() => void beginSignIn()} type="button">
      Enter Campfire
    </button>
  );
}
