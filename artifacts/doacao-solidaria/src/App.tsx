import { Switch, Route, Router as WouterRouter } from "wouter";
import Home from "@/pages/Home";
import ContaAtrasada from "@/pages/ContaAtrasada";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/conta-atrasada" component={ContaAtrasada} />
      <Route component={NotFound} />
    </Switch>
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
