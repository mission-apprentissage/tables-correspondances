import React, { useState } from "react";
import * as Yup from "yup";
import { Form as TablerForm, Card, Page, Grid, Table, Button } from "tabler-react";
import { Formik, Field, Form } from "formik";
import FormError from "../../common/components/FormError";
import FormMessage from "../../common/components/FormMessage";
import { _get } from "../../common/httpClient";

export default () => {
  let [etablissements, setEtablisssements] = useState([]);
  let findUai = async (values, { setStatus }) => {
    try {
      let res = await _get(`/api/v1/annuaire/etablissements`, values);
      setEtablisssements(res);
      if (res.length === 0) {
        setStatus({ message: "Pas de résultats" });
      }
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
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
                      filter: "0062093T",
                    }}
                    validationSchema={Yup.object().shape({
                      filter: Yup.string().required("Veuillez saisir une valeur (siret ou uai)"),
                    })}
                    onSubmit={findUai}
                  >
                    {({ status = {} }) => {
                      return (
                        <Form>
                          <TablerForm.Group label="Siret ou UAI">
                            <Field name="filter">
                              {({ field, meta }) => {
                                return (
                                  <TablerForm.Input type={"text"} placeholder="..." {...field} {...showError(meta)} />
                                );
                              }}
                            </Field>
                          </TablerForm.Group>
                          <Button color="primary" className="text-left" type={"submit"}>
                            Rechercher
                          </Button>
                          {status.error && <FormError>{status.error}</FormError>}
                          {status.message && <FormMessage>{status.message}</FormMessage>}
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
                        <Table.ColHeader>Uai</Table.ColHeader>
                        <Table.ColHeader>Siret</Table.ColHeader>
                        <Table.ColHeader>Nom</Table.ColHeader>
                        <Table.ColHeader>Uai secondaires</Table.ColHeader>
                        <Table.ColHeader />
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {etablissements.map((e) => {
                        return (
                          <Table.Row key={e.uai}>
                            <Table.Col>
                              <b>{e.uai}</b>
                            </Table.Col>
                            <Table.Col>{e.siret}</Table.Col>
                            <Table.Col>{e.nom}</Table.Col>
                            <Table.Col>{e.uais_secondaires.map((u) => `${u.uai}/${u.type}`).join("  ")}</Table.Col>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table>
                </Card.Body>
              </Card>
            </Grid.Col>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
};
