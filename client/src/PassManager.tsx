import { useEffect, useState } from "react";

type ManagedPass = {
  id: string;
  name: string;
  document: string;
  issuedAt: string;
  status: "ACTIVE" | "CANCELLED";
};

export default function PassManager() {
  const [passes, setPasses] = useState<ManagedPass[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadPasses() {
      try {
        const response = await fetch("/api/manage/passes");

        if (!response.ok) {
          throw new Error(`Could not load passes: HTTP ${response.status}`);
        }

        const data: ManagedPass[] = await response.json();

        if (!ignore) {
          setPasses(data);
        }
      } catch (error) {
        if (!ignore) {
          setError(
            error instanceof Error
              ? error.message
              : "Could not load passes."
          );
        }
      }
    }

    void loadPasses();

    return () => {
      ignore = true;
    };
  }, []);

  async function changePass(
    id: string,
    action: "cancel" | "delete"
  ) {
    if (
      action === "delete" &&
      !window.confirm("Delete this pass permanently?")
    ) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const url =
        action === "cancel"
          ? `/api/manage/passes/${id}/cancel`
          : `/api/manage/passes/${id}`;

      const response = await fetch(url, {
        method: action === "cancel" ? "POST" : "DELETE"
      });

      if (!response.ok) {
        throw new Error(`Action failed: HTTP ${response.status}`);
      }

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Action failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Manage passes</h2>

      {error && <p role="alert">{error}</p>}

      {passes === null ? (
        !error && <p>Loading passes...</p>
      ) : passes.length === 0 ? (
        <p>No passes yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Document</th>
              <th>Issued at</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {passes.map((pass) => (
              <tr key={pass.id}>
                <td>{pass.name}</td>
                <td>{pass.document}</td>
                <td>
                  {new Date(pass.issuedAt).toLocaleString()}
                </td>
                <td>{pass.status}</td>
                <td>
                  <a href={`/info/${pass.id}`}>View</a>{" "}

                  <button
                    type="button"
                    disabled={busy || pass.status === "CANCELLED"}
                    onClick={() => void changePass(pass.id, "cancel")}
                  >
                    Cancel
                  </button>{" "}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void changePass(pass.id, "delete")}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}