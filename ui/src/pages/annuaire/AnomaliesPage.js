import React from "react";
import { Card, Grid, Page, Table } from "tabler-react";
import Pagination from "./components/Pagination";
import { Link } from "react-router-dom";
import { useSearch } from "./hooks/useSearch";

const AnomaliesTable = ({ anomalies }) => {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.ColHeader>Type</Table.ColHeader>
          <Table.ColHeader>Source</Table.ColHeader>
          <Table.ColHeader>Date</Table.ColHeader>
          <Table.ColHeader>Message</Table.ColHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {anomalies.map((ano, index) => {
          return (
            <Table.Row key={index}>
              <Table.Col>{ano.type}</Table.Col>
              <Table.Col>{ano.source}</Table.Col>
              <Table.Col>{ano.date}</Table.Col>
              <Table.Col>{ano.details}</Table.Col>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
};

export default () => {
  let [{ data, loading }, search] = useSearch({ anomalies: true });

  return (
    <Page>
      <Page.Main>
        <Page.Content>
          <Page.Header>
            <Link to={`/annuaire`}>Annuaire</Link>> Rapport d'anomalies
          </Page.Header>
          <Grid.Row>
            <Grid.Col>
              <Card>
                <Card.Header>
                  <Card.Title>Etablissements ayant rencontrés une anomalie durant la collecte</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColHeader>Siret</Table.ColHeader>
                        <Table.ColHeader>Nom</Table.ColHeader>
                        <Table.ColHeader>Anomalies</Table.ColHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {loading || data.etablissements.length === 0 ? (
                        <Table.Row>
                          <Table.Col colSpan={4}>{loading ? "Chargement..." : "Pas de résultats"}</Table.Col>
                        </Table.Row>
                      ) : (
                        data.etablissements.map((e) => {
                          let anomalies = e._meta.anomalies;
                          return (
                            <Table.Row key={e.siret}>
                              <Table.Col>
                                <Link to={`/annuaire/etablissements/${e.siret}`}>{e.siret}</Link>
                              </Table.Col>
                              <Table.Col>{e.raison_sociale}</Table.Col>
                              <Table.Col>
                                <AnomaliesTable anomalies={anomalies} />
                              </Table.Col>
                            </Table.Row>
                          );
                        })
                      )}
                    </Table.Body>
                  </Table>
                  <Pagination pagination={data.pagination} onClick={(page) => search({ page })} />
                </Card.Body>
              </Card>
            </Grid.Col>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
};
