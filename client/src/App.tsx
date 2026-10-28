import HomePage from "./HomePage";
import PassPage from "./PassPage";

export default function App() {
  const match = window.location.pathname.match(
    /^\/info\/([^/]+)\/?$/
  );

  const id = match?.[1];

  if (id) {
    return <PassPage key={id} id={id} />;
  }

  return <HomePage />;
}