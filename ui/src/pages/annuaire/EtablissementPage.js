import React from "react";
import { Badge, Card, ContactCard, Grid, Page } from "tabler-react";
import { useFetch } from "../../common/hooks/useFetch";
import { Link, useParams } from "react-router-dom";
import FormError from "../../common/components/FormError";
import styled from "styled-components";

function UaiSecondaires({ items }) {
  return (
    <div>
      {items.length === 0
        ? "-"
        : items.map((item) => {
            return (
              <div>
                <span style={{ paddingRight: "0.5rem" }}>{item.uai}</span>
                <span>(source : {item.type})</span>
              </div>
            );
          })}
    </div>
  );
}

const Relation = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 1rem;
  span {
    padding-right: 0.5rem;
  }
`;

function Relations({ items }) {
  return (
    <div>
      {items.length === 0
        ? "-"
        : items.map((item) => {
            return (
              <Relation>
                {item.annuaire ? (
                  <Link style={{ width: "25%" }} to={`/annuaire/etablissements/${item.siret}`}>
                    {item.siret}
                  </Link>
                ) : (
                  <span style={{ width: "25%" }}>{item.siret}</span>
                )}
                <span style={{ width: "65%" }}>{item.details}</span>
                <span style={{ width: "10%", textAlign: "right" }}>
                  {item.statut === "fermé" ? <Badge color="danger">{item.statut}</Badge> : <span />}
                </span>
              </Relation>
            );
          })}
    </div>
  );
}

const Title = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;

  span {
    padding-right: 0.5rem;
  }
`;

export default () => {
  let { siret } = useParams();
  let [etablissement, loading, error] = useFetch(`/api/v1/annuaire/etablissements/${siret}`);
  let adresse = etablissement && etablissement.adresse;
  let name = `Etablissement ${siret}`;

  return (
    <Page>
      <Page.Main>
        <Page.Content>
          <Page.Header>
            <Link to={`/annuaire`}>Annuaire</Link>&nbsp;>&nbsp;{siret}
          </Page.Header>
          <Grid.Row>
            <Grid.Col>
              {error && <Card title={name} body={<FormError>Une erreur est survenue</FormError>} />}
              {etablissement && (
                <ContactCard
                  cardTitle={
                    <Title>
                      <span>{etablissement.raison_sociale}</span>
                      <span>
                        {etablissement.statut === "fermé" && <Badge color="danger">{etablissement.statut}</Badge>}
                      </span>
                    </Title>
                  }
                  rounded
                  objectURL="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2264%22%20height%3D%2264%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_15ec911398e%20text%20%7B%20fill%3Argba(255%2C255%2C255%2C.75)%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_15ec911398e%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20fill%3D%22%23777%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2213.84375%22%20y%3D%2236.65%22%3E64x64%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
                  alt={siret}
                  name={<div>{etablissement.raison_sociale}</div>}
                  address={{
                    line1: !adresse ? "" : adresse.label || `${adresse.code_postal} ${adresse.localite}`,
                    line2: `Académie ${etablissement.academie.nom}`,
                  }}
                  details={[
                    { title: "UAI", content: etablissement.uai || "-" },
                    { title: "Siège social", content: etablissement.siege_social ? "Oui" : "Non" },
                    {
                      title: "UAI secondaires",
                      content: <UaiSecondaires items={etablissement.uais_secondaires} />,
                    },
                    {
                      title: "Relations",
                      content: <Relations items={etablissement.relations} />,
                    },
                  ]}
                />
              )}
            </Grid.Col>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
};
