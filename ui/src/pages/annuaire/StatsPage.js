import React from "react";
import { get } from "lodash-es";
import { Card, Grid, Page, Table } from "tabler-react";
import { Link } from "react-router-dom";
import { useFetch } from "../../common/hooks/useFetch";
import Error from "../../common/components/Error";

export default StatsPage;

function StatsPage() {
  let [data, loading, error] = useFetch(`/api/v1/annuaire/stats`, { stats: [] });

  let latest = data.stats[0];
  return (
    <Page>
      <Page.Main>
        <Page.Content>
          <Page.Header>
            <Link to={`/annuaire`}>Annuaire</Link>> Stats
          </Page.Header>
          <Grid.Row>
            <Grid.Col>
              <Card>
                <Card.Header>
                  <Card.Title>Référentiels</Card.Title>
                </Card.Header>
                <Card.Body>
                  {error && <Error>Une erreur est survenue</Error>}
                  {loading || data.stats.length === 0 ? (
                    <div>{loading ? "Chargement..." : "Pas de résultats"}</div>
                  ) : (
                    <Table>
                      <Table.Header>
                        <Table.ColHeader>Nom</Table.ColHeader>
                        <Table.ColHeader>Sirens</Table.ColHeader>
                        <Table.ColHeader>Sirets</Table.ColHeader>
                      </Table.Header>
                      <Table.Body>
                        {data.stats[0].referentiels.map((referentiel) => {
                          return (
                            <Table.Row key={referentiel.name}>
                              <Table.Col>{referentiel.name}</Table.Col>
                              <Table.Col>{referentiel.nbSirens}</Table.Col>
                              <Table.Col>{referentiel.nbSirets}</Table.Col>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table>
                  )}
                </Card.Body>
              </Card>
              <Card>
                <Card.Header>
                  <Card.Title>Annuaire</Card.Title>
                </Card.Header>
                <Card.Body>
                  {loading || data.stats.length === 0 ? (
                    <div>{loading ? "Chargement..." : "Pas de résultats"}</div>
                  ) : (
                    <Table>
                      <Table.Header>
                        <Table.ColHeader>Sirens</Table.ColHeader>
                        <Table.ColHeader>Sirets</Table.ColHeader>
                        <Table.ColHeader>Gestionnaires et formateurs</Table.ColHeader>
                        <Table.ColHeader>Gestionnaires</Table.ColHeader>
                        <Table.ColHeader>Formateurs</Table.ColHeader>
                        <Table.ColHeader>Sans UAIs</Table.ColHeader>
                        <Table.ColHeader>Avec plusieurs UAIs</Table.ColHeader>
                      </Table.Header>
                      <Table.Body>
                        <Table.Row>
                          <Table.Col>{latest.globale.nbSirens}</Table.Col>
                          <Table.Col>{latest.globale.nbSirets}</Table.Col>
                          <Table.Col>{latest.globale.nbSiretsGestionnairesEtFormateurs}</Table.Col>
                          <Table.Col>{latest.globale.nbSiretsGestionnaires}</Table.Col>
                          <Table.Col>{latest.globale.nbSiretsFormateurs}</Table.Col>
                          <Table.Col>{latest.globale.nbSiretsSansUAIs}</Table.Col>
                          <Table.Col>{latest.globale.nbSiretsAvecPlusieursUAIs}</Table.Col>
                        </Table.Row>
                      </Table.Body>
                    </Table>
                  )}
                </Card.Body>
              </Card>
              <Card>
                <Card.Header>
                  <Card.Title>Académie</Card.Title>
                </Card.Header>
                <Card.Body>
                  {loading || data.stats.length === 0 ? (
                    <div>{loading ? "Chargement..." : "Pas de résultats"}</div>
                  ) : (
                    <Table>
                      <Table.Header>
                        <Table.ColHeader>Nom</Table.ColHeader>
                        <Table.ColHeader>Sirens</Table.ColHeader>
                        <Table.ColHeader>Sirets</Table.ColHeader>
                        <Table.ColHeader>Gestionnaires et formateurs</Table.ColHeader>
                        <Table.ColHeader>Gestionnaires</Table.ColHeader>
                        <Table.ColHeader>Formateurs</Table.ColHeader>
                        <Table.ColHeader>Sans UAIs</Table.ColHeader>
                        <Table.ColHeader>Avec plusieurs UAIs</Table.ColHeader>
                      </Table.Header>
                      <Table.Body>
                        {data.stats[0].academies.map((stats) => {
                          return (
                            <Table.Row key={get(stats, "academie.code", "inconnue")}>
                              <Table.Col>{get(stats, "academie.nom", "Inconnue")}</Table.Col>
                              <Table.Col>{stats.nbSirens}</Table.Col>
                              <Table.Col>{stats.nbSirets}</Table.Col>
                              <Table.Col>{stats.nbSiretsGestionnairesEtFormateurs}</Table.Col>
                              <Table.Col>{stats.nbSiretsGestionnaires}</Table.Col>
                              <Table.Col>{stats.nbSiretsFormateurs}</Table.Col>
                              <Table.Col>{stats.nbSiretsSansUAIs}</Table.Col>
                              <Table.Col>{stats.nbSiretsAvecPlusieursUAIs}</Table.Col>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Grid.Col>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
}
