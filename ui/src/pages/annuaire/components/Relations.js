import React from "react";
import { Badge } from "tabler-react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const Relations = styled.span`
  display: flex;
  justify-content: space-between;
  align-items: center;
  span {
    padding-right: 0.5rem;
  }
`;

export default ({ item }) => {
  return (
    <Relations>
      <span>
        {item.annuaire ? (
          <Link to={`/annuaire/etablissements/${item.siret}`}>{item.siret}</Link>
        ) : (
          <>
            <span>{item.siret}</span>
            <span>{item.raisonSociale}</span>
            <span>{item.adresse.codePostal}</span>
            <span>{item.adresse.localite}</span>
          </>
        )}
      </span>
      <span>{item.statut === "fermé" ? <Badge color="danger">{item.statut}</Badge> : <span />}</span>
    </Relations>
  );
};
