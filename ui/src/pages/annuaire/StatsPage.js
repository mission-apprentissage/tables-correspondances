import React from "react";
import styled from "styled-components";
import { sortBy } from "lodash-es";
import { Card, Grid, Page, Table } from "tabler-react";
import { Link } from "react-router-dom";
import { useFetch } from "../../common/hooks/useFetch";
import Error from "../../common/components/Error";
import FixedTable from "./components/FixedTable";

export default StatsPage;

export const StatsCard = styled(({ children, ...rest }) => {
  return (
    <Card {...rest}>
      <Card.Body className="stats">{children}</Card.Body>
    </Card>
  );
})`
  height: 75%;
  .stats {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    .value {
      font-size: 1.5rem;
      font-weight: 600;
    }
    .details {
      font-size: 0.9rem;
      font-weight: 400;
    }
  }
`;

function Percentage({ total, value, label }) {
  return (
    <div>
      <div>{Math.round((value * 100) / total)}%</div>
      {<div className={"value"}>{label || value}</div>}
    </div>
  );
}

function Matrice({ matrice }) {
  let sourcesNames = Object.keys(matrice).sort();

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
                            <div>{`${otherSource.union} couples UAI-SIRET`}</div>
                            <div>{`${otherSource.intersection} en commun`}</div>
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
  let { validation, matrice, similarites } = data.stats[0];

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
          <h2>Validation</h2>
          <Grid.Row>
            {error && <Error>Une erreur est survenue</Error>}
            <Grid.Col>
              {validation && (
                <>
                  <Card>
                    <Card.Header>
                      <Card.Title>UAI</Card.Title>
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
                          {Object.keys(validation)
                            .sort()
                            .map((key) => {
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
                      <Card.Title>SIRET</Card.Title>
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
                          {Object.keys(validation)
                            .sort()
                            .map((key) => {
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
            </Grid.Col>
          </Grid.Row>
          {matrice && (
            <>
              <h2>Etablissements (UAI-SIRET)</h2>
              <Grid.Row>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Nombre de couples uniques</div>
                    <div className="value">{similarites.total}</div>
                  </StatsCard>
                </Grid.Col>
              </Grid.Row>
              <h4>Fiabilité des couples UAI-SIRET</h4>
              <Grid.Row>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans toutes les sources</div>
                    <div className="value">{similarites["4"]}</div>
                    <div className="details">
                      <Percentage total={similarites.total} value={similarites["4"]} label={<div />} />
                    </div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans 3 sources sur 4</div>
                    <div className="value">{similarites["3"]}</div>
                    <div className="details">
                      <Percentage total={similarites.total} value={similarites["3"]} label={<div />} />
                    </div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans 2 sources sur 4</div>
                    <div className="value">{similarites["2"]}</div>
                    <div className="details">
                      <Percentage total={similarites.total} value={similarites["2"]} label={<div />} />
                    </div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans 1 source sur 4</div>
                    <div className="value">{similarites["1"]}</div>
                    <div className="details">
                      <Percentage total={similarites.total} value={similarites["1"]} label={<div />} />
                    </div>
                  </StatsCard>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row>
                <Grid.Col>
                  <Card>
                    <Card.Header>
                      <Card.Title>Pourcentage de recoupement par source</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Matrice matrice={matrice} />
                    </Card.Body>
                  </Card>
                </Grid.Col>
              </Grid.Row>
            </>
          )}
        </Page.Content>
      </Page.Main>
    </Page>
  );
}
