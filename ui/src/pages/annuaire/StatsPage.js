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
        <Table.ColHeader>
          <div>-</div>
        </Table.ColHeader>
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
                <div>{sourceName}</div>
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
                            <div>{`${otherSource.union} uniques`}</div>
                            <div>dont {`${otherSource.intersection} en commun`}</div>
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
  let { validation, matrices, recoupements } = data.stats[0];

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
          {validation && (
            <>
              <h2>Validation des établissements</h2>
              {error && <Error>Une erreur est survenue</Error>}
              <Grid.Row>
                <Grid.Col width={7}>
                  <Card>
                    <Card.Header>
                      <Card.Title>Validité des UAI</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <FixedTable>
                        <Table.Header>
                          <Table.ColHeader>Source</Table.ColHeader>
                          <Table.ColHeader>Valides</Table.ColHeader>
                          <Table.ColHeader>Invalides</Table.ColHeader>
                          <Table.ColHeader>Absents</Table.ColHeader>
                        </Table.Header>
                        <Table.Body>
                          {Object.keys(validation)
                            .sort()
                            .map((key) => {
                              let { total, uais } = validation[key];

                              return (
                                <Table.Row key={key}>
                                  <Table.Col>
                                    <div>{key}</div>
                                    <div className="value">{total}</div>
                                  </Table.Col>
                                  <Table.Col>
                                    <Percentage total={total} value={uais.valides} />
                                  </Table.Col>
                                  <Table.Col>
                                    <Percentage total={total} value={uais.invalides} />
                                  </Table.Col>
                                  <Table.Col>
                                    <Percentage total={total} value={uais.absents} />
                                  </Table.Col>
                                </Table.Row>
                              );
                            })}
                        </Table.Body>
                      </FixedTable>
                    </Card.Body>
                  </Card>
                </Grid.Col>
                <Grid.Col width={5}>
                  <Card>
                    <Card.Header>
                      <Card.Title>Unicité des UAI valides</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <FixedTable>
                        <Table.Header>
                          <Table.ColHeader>Source</Table.ColHeader>
                          <Table.ColHeader>Uniques</Table.ColHeader>
                          <Table.ColHeader>Dupliqués</Table.ColHeader>
                        </Table.Header>
                        <Table.Body>
                          {Object.keys(validation)
                            .sort()
                            .map((key) => {
                              let uais = validation[key].uais;

                              return (
                                <Table.Row key={key}>
                                  <Table.Col>
                                    <div>{key}</div>
                                    <div className="value">{uais.valides} valides</div>
                                  </Table.Col>
                                  <Table.Col>
                                    <Percentage total={uais.valides} value={uais.uniques} />
                                  </Table.Col>
                                  <Table.Col>
                                    <Percentage total={uais.valides} value={uais["dupliqués"]} />
                                  </Table.Col>
                                </Table.Row>
                              );
                            })}
                        </Table.Body>
                      </FixedTable>
                    </Card.Body>
                  </Card>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row>
                <Grid.Col width={7}>
                  <Card>
                    <Card.Header>
                      <Card.Title>Validité des SIRET</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <FixedTable>
                        <Table.Header>
                          <Table.ColHeader>Source</Table.ColHeader>
                          <Table.ColHeader>Valides</Table.ColHeader>
                          <Table.ColHeader>Invalides</Table.ColHeader>
                          <Table.ColHeader>Absents</Table.ColHeader>
                        </Table.Header>
                        <Table.Body>
                          {Object.keys(validation)
                            .sort()
                            .map((key) => {
                              let { total, sirets } = validation[key];

                              return (
                                <Table.Row key={key}>
                                  <Table.Col>
                                    <div>{key}</div>
                                    <div className="value">{total}</div>
                                  </Table.Col>
                                  <Table.Col>
                                    <Percentage
                                      total={total}
                                      value={sirets.actifs + sirets["fermés"]}
                                      label={`${sirets.actifs + sirets["fermés"]} dont ${sirets["fermés"]} fermés `}
                                    />
                                  </Table.Col>
                                  <Table.Col>
                                    <Percentage total={total} value={sirets.invalides} />
                                  </Table.Col>
                                  <Table.Col>
                                    <Percentage total={total} value={sirets.absents} />
                                  </Table.Col>
                                </Table.Row>
                              );
                            })}
                        </Table.Body>
                      </FixedTable>
                    </Card.Body>
                  </Card>
                </Grid.Col>
                <Grid.Col width={5}>
                  <Card>
                    <Card.Header>
                      <Card.Title>Unicité des SIRET valides</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <FixedTable>
                        <Table.Header>
                          <Table.ColHeader>Source</Table.ColHeader>
                          <Table.ColHeader>Uniques</Table.ColHeader>
                          <Table.ColHeader>Dupliqués</Table.ColHeader>
                        </Table.Header>
                        <Table.Body>
                          {Object.keys(validation)
                            .sort()
                            .map((key) => {
                              let sirets = validation[key].sirets;
                              let total = sirets.actifs + sirets.fermés;

                              return (
                                <Table.Row key={key}>
                                  <Table.Col>
                                    <div>{key}</div>
                                    <div className="value">{total}</div>
                                  </Table.Col>
                                  <Table.Col>
                                    <Percentage total={total} value={sirets.uniques} />
                                  </Table.Col>
                                  <Table.Col>
                                    <Percentage total={total} value={sirets["dupliqués"]} />
                                  </Table.Col>
                                </Table.Row>
                              );
                            })}
                        </Table.Body>
                      </FixedTable>
                    </Card.Body>
                  </Card>
                </Grid.Col>
              </Grid.Row>
            </>
          )}
          {recoupements && matrices && (
            <>
              <h2>Recoupement des UAI-SIRET</h2>
              <Grid.Row>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Nombre de couples uniques</div>
                    <div className="value">{recoupements.uais_sirets.total}</div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans toutes les sources</div>
                    <div className="value">{recoupements["3"]}</div>
                    <div className="details">
                      <Percentage
                        total={recoupements.uais_sirets.total}
                        value={recoupements.uais_sirets["3"]}
                        label={<div />}
                      />
                    </div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans 2 sources sur 3</div>
                    <div className="value">{recoupements["2"]}</div>
                    <div className="details">
                      <Percentage
                        total={recoupements.uais_sirets.total}
                        value={recoupements.uais_sirets["2"]}
                        label={<div />}
                      />
                    </div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans 1 sources sur 3</div>
                    <div className="value">{recoupements["1"]}</div>
                    <div className="details">
                      <Percentage
                        total={recoupements.uais_sirets.total}
                        value={recoupements.uais_sirets["1"]}
                        label={<div />}
                      />
                    </div>
                  </StatsCard>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row>
                <Grid.Col>
                  <Card>
                    <Card.Header>
                      <Card.Title>Recoupement par source</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Matrice matrice={matrices["uais_sirets"]} />
                    </Card.Body>
                  </Card>
                </Grid.Col>
              </Grid.Row>
              <h2>Recoupement des UAI</h2>
              <Grid.Row>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Nombre d'UAI uniques</div>
                    <div className="value">{recoupements.uais.total}</div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans toutes les sources</div>
                    <div className="value">{recoupements["3"]}</div>
                    <div className="details">
                      <Percentage total={recoupements.uais.total} value={recoupements.uais["3"]} label={<div />} />
                    </div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans 2 sources sur 3</div>
                    <div className="value">{recoupements["2"]}</div>
                    <div className="details">
                      <Percentage total={recoupements.uais.total} value={recoupements.uais["2"]} label={<div />} />
                    </div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans 1 sources sur 3</div>
                    <div className="value">{recoupements["1"]}</div>
                    <div className="details">
                      <Percentage total={recoupements.uais.total} value={recoupements.uais["1"]} label={<div />} />
                    </div>
                  </StatsCard>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row>
                <Grid.Col>
                  <Card>
                    <Card.Header>
                      <Card.Title>Recoupement par source</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Matrice matrice={matrices["uais"]} />
                    </Card.Body>
                  </Card>
                </Grid.Col>
              </Grid.Row>
              <h2>Recoupement des SIRET</h2>
              <Grid.Row>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Nombre de SIRET uniques</div>
                    <div className="value">{recoupements.sirets.total}</div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans toutes les sources</div>
                    <div className="value">{recoupements["3"]}</div>
                    <div className="details">
                      <Percentage total={recoupements.sirets.total} value={recoupements.sirets["3"]} label={<div />} />
                    </div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans 2 sources sur 3</div>
                    <div className="value">{recoupements["2"]}</div>
                    <div className="details">
                      <Percentage total={recoupements.sirets.total} value={recoupements.sirets["2"]} label={<div />} />
                    </div>
                  </StatsCard>
                </Grid.Col>
                <Grid.Col width={3}>
                  <StatsCard>
                    <div>Trouvés dans 1 sources sur 3</div>
                    <div className="value">{recoupements["1"]}</div>
                    <div className="details">
                      <Percentage total={recoupements.sirets.total} value={recoupements.sirets["1"]} label={<div />} />
                    </div>
                  </StatsCard>
                </Grid.Col>
              </Grid.Row>
              <Grid.Row>
                <Grid.Col>
                  <Card>
                    <Card.Header>
                      <Card.Title>Recoupement par source</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Matrice matrice={matrices["sirets"]} />
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
