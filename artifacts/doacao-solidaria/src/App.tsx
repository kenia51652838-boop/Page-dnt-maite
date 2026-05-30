import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";

const Home = lazy(() => import("@/pages/Home"));
const ContaAtrasada = lazy(() => import("@/pages/ContaAtrasada"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={null}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/conta-atrasada" component={ContaAtrasada} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
