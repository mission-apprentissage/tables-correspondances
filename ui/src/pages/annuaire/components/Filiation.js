import React from "react";
import { Badge } from "tabler-react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const Siret = styled.div`
  display: inline;
  padding-right: 1rem;
`;

export default ({ item }) => {
  return (
    <div>
      <Siret>
        {item.exists ? <Link to={`/annuaire/${item.siret}`}>{item.siret}</Link> : <span>{item.siret}</span>}
      </Siret>
      <span style={{ paddingRight: "1rem" }}>
        {item.statut === "fermé" ? <Badge color="danger">{item.statut}</Badge> : <span />}
      </span>
    </div>
  );
};
