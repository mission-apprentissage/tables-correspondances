![](https://avatars1.githubusercontent.com/u/63645182?s=200&v=4)

# Tables de Correspondances

Le projet Tables de correspondances est une application qui regroupe les APIs suivantes :

- CFD
- RNCP
- BCN
- [Annuaire](./ANNUAIRE.md)

## Démarrage rapide

Pour lancer l'application, vous pouvez exécuter les commandes suivantes :

```shell
make install
make start
```

L'application est ensuite disponible à l'url [http://localhost](http://localhost)

## Développement

Pour plus d'informations sur la structure du projet [DEV](./DEV.md)

## Environnements

Tables de correspondances est déployé sur deux environnements :

- [Recette](https://tables-correspondances-recette.apprentissage.beta.gouv.fr)
- [Production](https://tables-correspondances.apprentissage.beta.gouv.fr)

## SDK

La librairie peut être utilisée afin d'éviter les appels au serveur:

```bash
yarn add "@mission-apprentissage/tco-service-node"
```

Pour utiliser la lib il faut l'initialiser avec l'instance mongoose du projet qui l'utilise, pour qu'elle puisse créer des collections :
```js
const { initTcoModel } = require("@mission-apprentissage/tco-service-node");

await initTcoModel(mongoose);
```

Ensuite pour remplir les données il faut exécuter les scripts bcn, onisep et rncp :

```js
const { bcnImporter, onisepImporter, rncpImporter } = require("@mission-apprentissage/tco-service-node");

await bcnImporter();
await onisepImporter(db);
await rncpImporter();
```

Enfin vous pouvez appeler les méthodes dont vous avez besoin, e.g:

```js
const { getCfdInfo } = require("@mission-apprentissage/tco-service-node");

const cfdInfo = await getCfdInfo("40033002");
```

Vous aurez également besoin de renseigner certaines variables d'environnement, selon les appels que vous ferez :
```
TABLES_CORRESPONDANCES_API_ENTREPRISE_KEY=
TABLES_CORRESPONDANCE_ONISEP_EMAIL=
TABLES_CORRESPONDANCE_ONISEP_PASSWORD=
TABLES_CORRESPONDANCE_FRANCE_COMPETENCES_HOST=
TABLES_CORRESPONDANCE_FRANCE_COMPETENCES_PORT=
TABLES_CORRESPONDANCE_FRANCE_COMPETENCES_USERNAME=
TABLES_CORRESPONDANCE_FRANCE_COMPETENCES_PASSWORD=
```



