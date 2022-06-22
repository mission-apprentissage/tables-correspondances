import React from "react";
import { Site, Nav } from "tabler-react";
import useAuth from "../common/hooks/useAuth";
import { anonymous } from "../common/auth";
import { useHistory } from "react-router-dom";

export default (props) => {
  let [auth, setAuth] = useAuth();
  let history = useHistory();
  let logout = () => {
    setAuth(anonymous);
    history.push("/login");
  };

  return (
    <Site>
      <Site.Header>
        Tables de correspondances
        <div className="d-flex order-lg-2 ml-auto">
          {auth !== anonymous && (
            <Nav.Item hasSubNav value={auth.sub} icon="user">
              <a className="dropdown-item" onClick={logout}>
                Déconnexion
              </a>
            </Nav.Item>
          )}
        </div>
      </Site.Header>
      {props.children}
    </Site>
  );
};
