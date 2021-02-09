import React from "react";
import { omit } from "lodash-es";
import * as Yup from "yup";
import { Button, Card, Form as TablerForm, Grid, Page, Table, Badge } from "tabler-react";
import { Field, Form, Formik } from "formik";
import FormError from "../../common/components/FormError";
import Pagination from "./Pagination";
import FormMessage from "../../common/components/FormMessage";
import { useFetch } from "../../common/hooks/useFetch";
import queryString from "query-string";
import { useHistory } from "react-router-dom";

const buildQuery = (elements = {}) => {
  return `${queryString.stringify(elements, { skipNull: true, skipEmptyString: true })}`;
};

export default () => {
  let history = useHistory();
  let query = { page: 1, limit: 25, ...queryString.parse(window.location.search) };
  let [data, loading, error] = useFetch(`/api/v1/annuaire/etablissements?${buildQuery(query)}`, {
    etablissements: [],
    pagination: {
      page: 0,
      resultats_par_page: 0,
      nombre_de_page: 0,
      total: 0,
    },
  });

  let search = async (options = {}) => {
    let keys = Object.keys(options);
    history.push(`/annuaire?${buildQuery({ ...omit(query, keys), ...options })}`);
  };

  let showError = (meta) => {
    return meta.touched && meta.error
      ? {
          feedback: meta.error,
          invalid: true,
        }
      : {};
  };

  return (
    <Page>
      <Page.Main>
        <Page.Content>
          <Page.Header>Annuaire</Page.Header>
          <Grid.Row>
            <Grid.Col>
              <Card>
                <Card.Header>
                  <Card.Title>Rechercher un établissement</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Formik
                    initialValues={{
                      filter: "",
                    }}
                    validationSchema={Yup.object().shape({
                      filter: Yup.string(),
                    })}
                    onSubmit={search}
                  >
                    {({ status = {} }) => {
                      return (
                        <Form>
                          <TablerForm.Group label="Siret ou UAI">
                            <Field name="filter">
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
                        <Table.ColHeader>Uai secondaires</Table.ColHeader>
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
                              <Table.Col>{e.siret}</Table.Col>
                              <Table.Col>{e.uai}</Table.Col>
                              <Table.Col>{e.nom}</Table.Col>
                              <Table.Col>
                                {e.uais_secondaires.map((u) => {
                                  return (
                                    <div>
                                      <span style={{ paddingRight: "1rem" }}>{u.uai}</span>
                                      <Badge>{u.type}</Badge>
                                    </div>
                                  );
                                })}
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
