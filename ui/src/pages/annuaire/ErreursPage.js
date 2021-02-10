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

const ErreursTable = ({ errors }) => {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.ColHeader>Type</Table.ColHeader>
          <Table.ColHeader>Source</Table.ColHeader>
          <Table.ColHeader>Message</Table.ColHeader>
          <Table.ColHeader>Dated</Table.ColHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {errors.map((err) => {
          return (
            <Table.Row>
              <Table.Col>{err.type}</Table.Col>
              <Table.Col>{err.source}</Table.Col>
              <Table.Col>{err.reason}</Table.Col>
              <Table.Col>{err.date}</Table.Col>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
};
export default () => {
  let history = useHistory();
  let query = { page: 1, order: -1, limit: 25, ...queryString.parse(window.location.search), erreurs: true };
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
    history.push(`/annuaire?${buildQuery({ ...omit(query, keys), ...options })}`);
  }

  return (
    <Page>
      <Page.Main>
        <Page.Content>
          <Page.Header>
            <Link to={`/annuaire`}>Annuaire</Link>> Rapport d'erreurs
          </Page.Header>
          <Grid.Row>
            <Grid.Col>
              <Card>
                <Card.Header>
                  <Card.Title>Etablissements en erreur</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColHeader>Siret</Table.ColHeader>
                        <Table.ColHeader>Nom</Table.ColHeader>
                        <Table.ColHeader>Erreurs</Table.ColHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {loading || data.etablissements.length === 0 ? (
                        <Table.Row>
                          <Table.Col colSpan={4}>{loading ? "Chargement..." : "Pas de résultats"}</Table.Col>
                        </Table.Row>
                      ) : (
                        data.etablissements.map((e) => {
                          let errors = e._meta._errors;
                          return (
                            <Table.Row key={e.uai}>
                              <Table.Col>
                                <Link to={`/annuaire/etablissements/${e.siret}`}>{e.siret}</Link>
                              </Table.Col>
                              <Table.Col>{e.uai}</Table.Col>
                              <Table.Col>
                                <ErreursTable errors={errors} />
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
