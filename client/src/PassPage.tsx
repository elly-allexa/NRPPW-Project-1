import { useEffect, useState } from "react";

type PublicPass = {
  id: string;
  name: string;
  document: string;
  issuedAt: string;
  status: "ACTIVE" | "CANCELLED";
};

type PageState =
  | { kind: "loading" }
  | { kind: "success"; pass: PublicPass }
  | { kind: "error"; message: string };

export default function PassPage({ id }: { id: string }) {
  const [state, setState] = useState<PageState>({
    kind: "loading"
  });

  useEffect(() => {
    let ignore = false;

    async function loadPass() {
      try {
        const response = await fetch(
          `/api/public-passes/${encodeURIComponent(id)}`
        );

        if (response.status === 404) {
          throw new Error("Pass not found.");
        }

        if (!response.ok) {
          throw new Error(`Could not load pass: HTTP ${response.status}`);
        }

        const pass: PublicPass = await response.json();

        if (!ignore) {
          setState({ kind: "success", pass });
        }
      } catch (error) {
        if (!ignore) {
          setState({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load pass."
          });
        }
      }
    }

    void loadPass();

    return () => {
      ignore = true;
    };
  }, [id]);

  if (state.kind === "loading") {
  return (
    <main className="app-page">
      <p>Loading pass...</p>
    </main>
  );
}

  if (state.kind === "error") {
    return (
      <main className="app-page">
        <h1>Digital Pass</h1>
        <p role="alert">{state.message}</p>
        <a href="/">Home</a>
      </main>
    );
  }

  const { pass } = state;

  return (
    <main className="app-page">
      <h1>Digital Pass</h1>

      <dl>
        <dt>Status</dt>
        <dd><strong>{pass.status}</strong></dd>

        <dt>Name</dt>
        <dd>{pass.name}</dd>

        <dt>Document</dt>
        <dd>{pass.document}</dd>

        <dt>Issued at</dt>
        <dd>
          <time dateTime={pass.issuedAt}>
            {new Date(pass.issuedAt).toLocaleString()}
          </time>
        </dd>
      </dl>

      <a href="/">Home</a>
    </main>
  );
}