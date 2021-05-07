import React from "react";
import { Badge, Card, Grid, Page, Table } from "tabler-react";
import { useFetch } from "../../common/hooks/useFetch";
import { Link, useParams } from "react-router-dom";
import FormError from "../../common/components/Error";
import styled from "styled-components";

const Item = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 1rem;
  span {
    &:nth-child(1) {
      font-weight: bold;
      width: 15%;
    }
    &:nth-child(2) {
      width: 25%;
    }
  }
`;

const List = styled.div`
  margin-bottom: 1rem;
  div:first-child {
    &:nth-child(1) {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
  }
`;

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
                <Card
                  title={
                    <Title>
                      <span>Etablissement</span>
                      <span>
                        {etablissement.statut === "fermé" && <Badge color="danger">{etablissement.statut}</Badge>}
                      </span>
                    </Title>
                  }
                  body={
                    <div>
                      <Item>
                        <span>Nom</span>
                        <span>{etablissement.raison_sociale}</span>
                      </Item>
                      <Item>
                        <span>Siret</span>
                        <span>{etablissement.siret}</span>
                      </Item>
                      <Item>
                        <span>Forme juridique</span>
                        <span>{etablissement.forme_juridique ? etablissement.forme_juridique.label : "-"}</span>
                      </Item>
                      <Item>
                        <span>Statut</span>
                        <span>{etablissement.statut}</span>
                      </Item>
                      <Item>
                        <span>Siège social</span>
                        <span>{etablissement.siege_social ? "Oui" : "Non"}</span>
                      </Item>
                      <Item>
                        <span>Adresse</span>
                        <span>{!adresse ? "" : adresse.label || `${adresse.code_postal} ${adresse.localite}`}</span>
                      </Item>
                      {etablissement.academie && (
                        <Item>
                          <span>Académie</span>
                          <span>{etablissement.academie.nom}</span>
                        </Item>
                      )}
                      <Item>
                        <span>Réseaux</span>
                        <span>{etablissement.reseaux.length === 0 ? "-" : etablissement.reseaux.join(",")}</span>
                      </Item>
                      <List>
                        <div>UAIs</div>
                        <Table>
                          <Table.Header>
                            <Table.ColHeader>UAI</Table.ColHeader>
                            <Table.ColHeader>Sources</Table.ColHeader>
                            <Table.ColHeader>Valide</Table.ColHeader>
                          </Table.Header>
                          <Table.Body>
                            {etablissement.uais.map((item) => {
                              return (
                                <Table.Row key={item.uai}>
                                  <Table.Col>{item.uai}</Table.Col>
                                  <Table.Col>{item.sources.join(",")}</Table.Col>
                                  <Table.Col>{item.valide ? "oui" : "non"}</Table.Col>
                                </Table.Row>
                              );
                            })}
                          </Table.Body>
                        </Table>
                      </List>
                      <List>
                        <div>Relations</div>
                        <Table>
                          <Table.Header>
                            <Table.ColHeader>Siret</Table.ColHeader>
                            <Table.ColHeader>Label</Table.ColHeader>
                            <Table.ColHeader>Type</Table.ColHeader>
                            <Table.ColHeader>Sources</Table.ColHeader>
                          </Table.Header>
                          <Table.Body>
                            {etablissement.relations.map((item, index) => {
                              return (
                                <Table.Row key={index}>
                                  <Table.Col>
                                    {item.annuaire ? (
                                      <Link to={`/annuaire/etablissements/${item.siret}`}>{item.siret}</Link>
                                    ) : (
                                      item.siret
                                    )}
                                  </Table.Col>
                                  <Table.Col>{item.label}</Table.Col>
                                  <Table.Col>{item.type}</Table.Col>
                                  <Table.Col>{item.sources.join(",")}</Table.Col>
                                </Table.Row>
                              );
                            })}
                          </Table.Body>
                        </Table>
                      </List>
                      <List>
                        <div>Lieux de formations</div>
                        <Table>
                          <Table.Header>
                            <Table.ColHeader>Siret</Table.ColHeader>
                            <Table.ColHeader>Adresse</Table.ColHeader>
                          </Table.Header>
                          <Table.Body>
                            {etablissement.lieux_de_formation.map((item, index) => {
                              return (
                                <Table.Row key={index}>
                                  <Table.Col>{item.siret || "-"}</Table.Col>
                                  <Table.Col>{item.adresse.label}</Table.Col>
                                </Table.Row>
                              );
                            })}
                          </Table.Body>
                        </Table>
                      </List>
                      <List>
                        <div>Diplomes</div>
                        <Table>
                          <Table.Header>
                            <Table.ColHeader>Code</Table.ColHeader>
                            <Table.ColHeader>Label</Table.ColHeader>
                            <Table.ColHeader>Type</Table.ColHeader>
                          </Table.Header>
                          <Table.Body>
                            {etablissement.diplomes.map((item) => {
                              return (
                                <Table.Row key={item.code}>
                                  <Table.Col>{item.code}</Table.Col>
                                  <Table.Col>{item.label}</Table.Col>
                                  <Table.Col>{item.type}</Table.Col>
                                </Table.Row>
                              );
                            })}
                          </Table.Body>
                        </Table>
                      </List>
                      <List>
                        <div>Certifications</div>
                        <Table>
                          <Table.Header>
                            <Table.ColHeader>Code</Table.ColHeader>
                            <Table.ColHeader>Label</Table.ColHeader>
                            <Table.ColHeader>Type</Table.ColHeader>
                          </Table.Header>
                          <Table.Body>
                            {etablissement.certifications.map((item) => {
                              return (
                                <Table.Row key={item.code}>
                                  <Table.Col>{item.code}</Table.Col>
                                  <Table.Col>{item.label}</Table.Col>
                                  <Table.Col>{item.type}</Table.Col>
                                </Table.Row>
                              );
                            })}
                          </Table.Body>
                        </Table>
                      </List>
                    </div>
                  }
                />
              )}
            </Grid.Col>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
};
