import React from "react";
import { sortBy } from "lodash-es";
import { Card, Grid, Page, Table } from "tabler-react";
import { Link } from "react-router-dom";
import { useFetch } from "../../common/hooks/useFetch";
import Error from "../../common/components/Error";
import FixedTable from "./components/FixedTable";

export default StatsPage;

function Percentage({ total, value, label }) {
  return (
    <div>
      <div>{Math.round((value * 100) / total)}%</div>
      {<div className={"value"}>{label || value}</div>}
    </div>
  );
}

function Matrice({ matrices, type }) {
  let matrice = matrices[type];
  let sourcesNames = sortBy(Object.keys(matrice));

  return (
    <FixedTable>
      <Table.Header>
        <>
          <Table.ColHeader>
            <div>-</div>
          </Table.ColHeader>
        </>
        {sourcesNames.map((sourceName) => {
          return <Table.ColHeader key={sourceName}>{sourceName}</Table.ColHeader>;
        })}
      </Table.Header>
      <Table.Body>
        {sourcesNames.map((sourceName) => {
          let source = matrice[sourceName];
          let otherSourceNames = sortBy(Object.keys(source).filter((n) => n !== "total"));

          return (
            <Table.Row key={sourceName}>
              <Table.Col>
                <div>
                  <div>{sourceName}</div>
                </div>
              </Table.Col>
              {otherSourceNames.map((otherSourceName) => {
                let otherSource = source[otherSourceName];

                return (
                  <Table.Col key={otherSourceName}>
                    {sourceName === otherSourceName ? (
                      <span>-</span>
                    ) : (
                      <Percentage
                        value={otherSource.intersection}
                        total={otherSource.union}
                        label={
                          <div>
                            <div>{`${otherSource.union} ${type.toUpperCase()} uniques`}</div>
                            <div>{`dont ${otherSource.intersection} en commun`}</div>
                          </div>
                        }
                      />
                    )}
                  </Table.Col>
                );
              })}
            </Table.Row>
          );
        })}
      </Table.Body>
    </FixedTable>
  );
}

function StatsPage() {
  let [data, loading, error] = useFetch(`/api/v1/annuaire/stats`, { stats: [{}] });
  let { validation, matrices } = data.stats[0];

  if (loading || data.stats.length === 0) {
    return <div>{loading ? "Chargement..." : "Pas de résultats"}</div>;
  }

  return (
    <Page>
      <Page.Main>
        <Page.Content>
          <Page.Header>
            <Link to={`/annuaire`}>Annuaire</Link>> Stats
          </Page.Header>
          <Grid.Row>
            {error && <Error>Une erreur est survenue</Error>}
            <Grid.Col>
              {validation && (
                <>
                  <Card>
                    <Card.Header>
                      <Card.Title>Validation des UAI</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <FixedTable>
                        <Table.Header>
                          <Table.ColHeader>Source</Table.ColHeader>
                          <Table.ColHeader>Total</Table.ColHeader>
                          <Table.ColHeader>Conformes et uniques</Table.ColHeader>
                          <Table.ColHeader>Dupliqués</Table.ColHeader>
                          <Table.ColHeader>Absents</Table.ColHeader>
                          <Table.ColHeader>Invalides</Table.ColHeader>
                        </Table.Header>
                        <Table.Body>
                          {Object.keys(validation).map((key) => {
                            let { total, uais } = validation[key];

                            return (
                              <Table.Row key={key}>
                                <Table.Col>{key}</Table.Col>
                                <Table.Col>{total}</Table.Col>
                                <Table.Col>
                                  <Percentage total={total} value={uais.valides} />
                                </Table.Col>
                                <Table.Col>
                                  <Percentage total={total} value={uais["dupliqués"]} />
                                </Table.Col>
                                <Table.Col>
                                  <Percentage total={total} value={uais.absents} />
                                </Table.Col>
                                <Table.Col>
                                  <Percentage total={total} value={uais.invalides} />
                                </Table.Col>
                              </Table.Row>
                            );
                          })}
                        </Table.Body>
                      </FixedTable>
                    </Card.Body>
                  </Card>
                  <Card>
                    <Card.Header>
                      <Card.Title>Validation des SIRET</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <FixedTable>
                        <Table.Header>
                          <Table.ColHeader>Source</Table.ColHeader>
                          <Table.ColHeader>Total</Table.ColHeader>
                          <Table.ColHeader>Conformes et uniques</Table.ColHeader>
                          <Table.ColHeader>Dupliqués</Table.ColHeader>
                          <Table.ColHeader>Fermés</Table.ColHeader>
                          <Table.ColHeader>Inconnus</Table.ColHeader>
                          <Table.ColHeader>Absents</Table.ColHeader>
                          <Table.ColHeader>Invalides</Table.ColHeader>
                          <Table.ColHeader>Erreurs</Table.ColHeader>
                        </Table.Header>
                        <Table.Body>
                          {Object.keys(validation).map((key) => {
                            let { total, sirets } = validation[key];

                            return (
                              <Table.Row key={key}>
                                <Table.Col>{key}</Table.Col>
                                <Table.Col>{total}</Table.Col>
                                <Table.Col>
                                  <Percentage total={total} value={sirets.valides} />
                                </Table.Col>
                                <Table.Col>
                                  <Percentage total={total} value={sirets["dupliqués"]} />
                                </Table.Col>
                                <Table.Col>
                                  <Percentage total={total} value={sirets["fermés"]} />
                                </Table.Col>
                                <Table.Col>
                                  <Percentage total={total} value={sirets.inconnus} />
                                </Table.Col>
                                <Table.Col>
                                  <Percentage total={total} value={sirets.absents} />
                                </Table.Col>
                                <Table.Col>
                                  <Percentage total={total} value={sirets.invalides} />
                                </Table.Col>
                                <Table.Col>
                                  <Percentage total={total} value={sirets.erreurs} />
                                </Table.Col>
                              </Table.Row>
                            );
                          })}
                        </Table.Body>
                      </FixedTable>
                    </Card.Body>
                  </Card>
                </>
              )}
              {matrices && (
                <>
                  <Card>
                    <Card.Header>
                      <Card.Title>Matrice de recoupement par UAI et SIRET</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Matrice type={"uai_siret"} matrices={matrices} />
                    </Card.Body>
                  </Card>

                  <Card>
                    <Card.Header>
                      <Card.Title>Matrice de recoupement par UAI</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Matrice type={"uai"} matrices={matrices} />
                    </Card.Body>
                  </Card>
                  <Card>
                    <Card.Header>
                      <Card.Title>Matrice de recoupement par Siret (+datagouv)</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Matrice type={"siret"} matrices={matrices} />
                    </Card.Body>
                  </Card>
                </>
              )}
            </Grid.Col>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
}
