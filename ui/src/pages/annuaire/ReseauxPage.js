import React from "react";
import { uniqWith } from "lodash-es";
import { Card, Grid, Page } from "tabler-react";
import { ResponsiveNetwork } from "@nivo/network";
import { Link } from "react-router-dom";
import buildQuery from "../../common/utils/buildQuery";
import { useFetch } from "../../common/hooks/useFetch";

function getReseau(etablissements) {
  let nodes = etablissements.map((e) => {
    return {
      id: e.siret,
      raison_sociale: e.raison_sociale,
      radius: 8,
      depth: 1,
      color: "rgb(97, 205, 187)",
    };
  });

  let links = etablissements.reduce((acc, e) => {
    return [
      ...acc,
      ...e.relations
        .filter((relation) => relation.annuaire)
        .map((relation) => {
          return {
            source: e.siret,
            target: relation.siret,
          };
        }),
    ];
  }, []);

  return { nodes, links: uniqWith(links, (a, b) => `${a.source}${a.target}` === `${b.source}${b.target}`) };
}

function Reseau({ etablissements }) {
  if (etablissements.length === 0) {
    return <div />;
  }

  let { nodes, links } = getReseau(etablissements);

  return (
    <div style={{ height: "800px" }}>
      <ResponsiveNetwork
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        repulsivity={1}
        nodeColor={(e) => e.color}
        nodeBorderWidth={1}
        nodeBorderColor={{ from: "color", modifiers: [["darker", 0.8]] }}
        nodes={nodes}
        animate={true}
        links={links}
        tooltip={(node) => {
          return <div>{node.raison_sociale}</div>;
        }}
      />
    </div>
  );
}

export default () => {
  let query = {
    page: 1,
    items_par_page: 5000,
    champs: "siret,raison_sociale,relations",
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

  return (
    <Page>
      <Page.Main>
        <Page.Content>
          <Page.Header>
            <Link to={`/annuaire`}>Annuaire</Link>> Réseaux
          </Page.Header>
          <Grid.Row>
            <Grid.Col>
              <Card>
                <Card.Header>
                  <Card.Title>Réseaux</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Reseau etablissements={data.etablissements} />
                </Card.Body>
              </Card>
            </Grid.Col>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
};
