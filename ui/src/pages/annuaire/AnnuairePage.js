import React from "react";
import { omit } from "lodash-es";
import * as Yup from "yup";
import { Button, Card, Form as TablerForm, Grid, Page, Table } from "tabler-react";
import { Field, Form, Formik } from "formik";
import FormError from "../../common/components/FormError";
import FormMessage from "../../common/components/FormMessage";
import { useFetch } from "../../common/hooks/useFetch";
import queryString from "query-string";
import { Link, useHistory } from "react-router-dom";
import SortButton from "./components/SortButton";
import styled from "styled-components";
import Pagination from "./components/Pagination";

const Header = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
`;

function buildQuery(elements = {}) {
  return `${queryString.stringify(elements, { skipNull: true, skipEmptyString: true })}`;
}

export default () => {
  let history = useHistory();
  let query = {
    page: 1,
    ordre: -1,
    items_par_page: 25,
    ...queryString.parse(window.location.search),
    anomalies: false,
  };
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

  function showError(meta) {
    return meta.touched && meta.error
      ? {
          feedback: meta.error,
          invalid: true,
        }
      : {};
  }

  return (
    <Page>
      <Page.Main>
        <Page.Content>
          <Page.Header>
            <Header>
              <Link to={`/annuaire`}>Annuaire</Link>
              <Button color={"danger"} onClick={() => history.push("/annuaire/anomalies")}>
                Voir le rapport d'anomalies >
              </Button>
            </Header>
          </Page.Header>
          <Grid.Row>
            <Grid.Col>
              <Card>
                <Card.Header>
                  <Card.Title>Rechercher un établissement</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Formik
                    initialValues={{
                      text: "",
                    }}
                    validationSchema={Yup.object().shape({
                      text: Yup.string(),
                    })}
                    onSubmit={(values) => search({ page: 1, ...values })}
                  >
                    {({ status = {} }) => {
                      return (
                        <Form>
                          <TablerForm.Group label="Raison sociale, siret ou UAI">
                            <Field name="text">
                              {({ field, meta }) => {
                                return <TablerForm.Input placeholder="..." {...field} {...showError(meta)} />;
                              }}
                            </Field>
                          </TablerForm.Group>
                          <Button color="primary" className="text-left" type={"submit"}>
                            Rechercher
                          </Button>

                          {status.message && <FormMessage>{status.message}</FormMessage>}
                          {error && <FormError>Une erreur est survenue</FormError>}
                        </Form>
                      );
                    }}
                  </Formik>
                </Card.Body>
              </Card>
            </Grid.Col>
          </Grid.Row>
          <Grid.Row>
            <Grid.Col>
              <Card>
                <Card.Header>
                  <Card.Title>Résultats</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColHeader>Siret</Table.ColHeader>
                        <Table.ColHeader>Uai</Table.ColHeader>
                        <Table.ColHeader>Nom</Table.ColHeader>
                        <Table.ColHeader>
                          Uai secondaires
                          <SortButton onClick={(ordre) => search({ page: 1, tri: "uais_secondaires", ordre })} />
                        </Table.ColHeader>
                        <Table.ColHeader>
                          Relations <SortButton onClick={(ordre) => search({ page: 1, tri: "relations", ordre })} />
                        </Table.ColHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {loading || data.etablissements.length === 0 ? (
                        <Table.Row>
                          <Table.Col colSpan={4}>{loading ? "Chargement..." : "Pas de résultats"}</Table.Col>
                        </Table.Row>
                      ) : (
                        data.etablissements.map((e) => {
                          return (
                            <Table.Row key={e.uai}>
                              <Table.Col>
                                <Link to={`/annuaire/etablissements/${e.siret}`}>{e.siret}</Link>
                              </Table.Col>
                              <Table.Col>{e.uai}</Table.Col>
                              <Table.Col>{e.raison_sociale}</Table.Col>
                              <Table.Col>{e.uais_secondaires.length}</Table.Col>
                              <Table.Col>{e.relations.length}</Table.Col>
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
