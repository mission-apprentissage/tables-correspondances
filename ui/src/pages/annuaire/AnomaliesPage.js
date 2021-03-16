import React from "react";
import { omit } from "lodash-es";
import { Card, Grid, Page, Table } from "tabler-react";
import Pagination from "./components/Pagination";
import { useFetch } from "../../common/hooks/useFetch";
import queryString from "query-string";
import { Link, useHistory } from "react-router-dom";

function buildQuery(elements = {}) {
  return `${queryString.stringify(elements, { skipNull: true, skipEmptyString: true })}`;
}

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
        {anomalies.map((ano) => {
          return (
            <Table.Row>
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
  let history = useHistory();
  let query = { page: 1, ordre: -1, items_par_page: 25, ...queryString.parse(window.location.search), anomalies: true };
  let [data, loading, error] = useFetch(`/api/v1/annuaire/etablissements?${buildQuery(query)}`, {
    etablissements: [],
    pagination: {
      page: 0,
      resultats_par_page: 0,
      nombre_de_page: 0,
      total: 0,
    },
  });

  function search(options = {}) {
    let keys = Object.keys(options);
    history.push(`/annuaire/anomalies?${buildQuery({ ...omit(query, keys), ...options })}`);
  }

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
                            <Table.Row key={e.uai}>
                              <Table.Col>
                                <Link to={`/annuaire/etablissements/${e.siret}`}>{e.siret}</Link>
                              </Table.Col>
                              <Table.Col>{e.uai}</Table.Col>
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
