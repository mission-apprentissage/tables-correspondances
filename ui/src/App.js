import React from "react";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AnnuairePage from "./pages/annuaire/AnnuairePage";
import EtablissementPage from "./pages/annuaire/EtablissementPage";
import Layout from "./pages/Layout";
import "tabler-react/dist/Tabler.css";
import DashboardPage from "./pages/DashboardPage";
import useAuth from "./common/hooks/useAuth";
import HomePage from "./pages/HomePage";
import ResetPasswordPage from "./pages/password/ResetPasswordPage";
import ForgottenPasswordPage from "./pages/password/ForgottenPasswordPage";
import ErreursPage from "./pages/annuaire/IncidentsPage";

function PrivateRoute({ children, ...rest }) {
  let [auth] = useAuth();

  return (
    <Route
      {...rest}
      render={() => {
        return auth.sub !== "anonymous" ? children : <Redirect to="/login" />;
      }}
    />
  );
}

export default () => {
  let [auth] = useAuth();

  return (
    <div className="App">
      <Router>
        <Switch>
          <PrivateRoute exact path="/">
            <Layout>{auth && auth.permissions.isAdmin ? <DashboardPage /> : <HomePage />}</Layout>
          </PrivateRoute>
          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/reset-password" component={ResetPasswordPage} />
          <Route exact path="/forgotten-password" component={ForgottenPasswordPage} />
          <Layout>
            <Route exact path="/annuaire" component={AnnuairePage} />
            <Route exact path="/annuaire/erreurs" component={ErreursPage} />
            <Route exact path="/annuaire/etablissements/:siret" component={EtablissementPage} />
          </Layout>
        </Switch>
      </Router>
    </div>
  );
};
