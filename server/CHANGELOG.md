# [2.3.0](https://github.com/mission-apprentissage/tables-correspondances/compare/v2.2.0...v2.3.0) (2021-03-22)


### Bug Fixes

* code_type_certif xml ([28ac417](https://github.com/mission-apprentissage/tables-correspondances/commit/28ac4173673198a8afed76fc9a3cc6084d29e677))
* fill code_type_certif from bcn if empty from kit ([#112](https://github.com/mission-apprentissage/tables-correspondances/issues/112)) ([74bc6fd](https://github.com/mission-apprentissage/tables-correspondances/commit/74bc6fdf4c0db047e1fd8abec7b4134b006effc2))
* **bcn:** find cfd bcn add condition check ([c147bbd](https://github.com/mission-apprentissage/tables-correspondances/commit/c147bbd540e93a8723872997dedf0f4ae74bd94f))
* fixing exports method to fit with sdk ([e228827](https://github.com/mission-apprentissage/tables-correspondances/commit/e228827b54ec662e60b2139b252bfc1d3bb53b37))


### Features

* rncp rewrite with XML data ([#108](https://github.com/mission-apprentissage/tables-correspondances/issues/108)) ([d49982b](https://github.com/mission-apprentissage/tables-correspondances/commit/d49982b247b9439f5fc344018f99bf80b3fbfdd2))

# [2.2.0](https://github.com/mission-apprentissage/tables-correspondances/compare/v2.1.0...v2.2.0) (2021-03-10)


### Features

* **sdk:** add mef, siret, uai validation ([ce65717](https://github.com/mission-apprentissage/tables-correspondances/commit/ce6571706450ec89c55907f0544ad8ff344f97c6))

# [2.1.0](https://github.com/mission-apprentissage/tables-correspondances/compare/v2.0.0...v2.1.0) (2021-03-10)


### Features

* **sdk:** add bcn importer and cfd info ([4e57f49](https://github.com/mission-apprentissage/tables-correspondances/commit/4e57f49aafb5f3cf980ee50121f2a8ff5f8eed11))
* change file name ([13bdfa1](https://github.com/mission-apprentissage/tables-correspondances/commit/13bdfa105360140fb13557777017357843217e09))

# [2.0.0](https://github.com/mission-apprentissage/tables-correspondances/compare/v1.2.0...v2.0.0) (2021-03-09)


* Next stepsdk (#89) ([394baba](https://github.com/mission-apprentissage/tables-correspondances/commit/394baba9722347abe2550c7caaf787453a745c29)), closes [#89](https://github.com/mission-apprentissage/tables-correspondances/issues/89)


### Bug Fixes

* date de fermeture ([6f796c5](https://github.com/mission-apprentissage/tables-correspondances/commit/6f796c54d345cf59e619a635e9ba4f0f41e9097c))
* fix academie check ([70308c9](https://github.com/mission-apprentissage/tables-correspondances/commit/70308c945d3388a09af100450dc424df363b4baf))
* prevent exception when apiEntreprise returns empty response ([d08c078](https://github.com/mission-apprentissage/tables-correspondances/commit/d08c0782919fac6e7edb4e343b3ec6b42bc58455))
* **oupsy:** rm ! ([77437cb](https://github.com/mission-apprentissage/tables-correspondances/commit/77437cba593fc163a57874cf6f441b37b2c97824))
* decrease chunk size ([5769c0f](https://github.com/mission-apprentissage/tables-correspondances/commit/5769c0fd2e66ce52b5f24068a5ae445757fcb109))
* increase container mem limit server ([75fa33a](https://github.com/mission-apprentissage/tables-correspondances/commit/75fa33af28a89eeacfb1973f1e26ead474ae8cb8))
* linter exclude sdk folder ([6c7b1c6](https://github.com/mission-apprentissage/tables-correspondances/commit/6c7b1c63a2289a8256f2767c1fc6d4b94c0c6ba3))
* rename confusing vars & prevent etablissement duplicates ([#70](https://github.com/mission-apprentissage/tables-correspondances/issues/70)) ([47f5cba](https://github.com/mission-apprentissage/tables-correspondances/commit/47f5cbae9fe998322c019cea7a784e5445fca9df))
* tags ([074e7bc](https://github.com/mission-apprentissage/tables-correspondances/commit/074e7bcfedd056f896570fc6d4247db9f188209b))
* tags ([527f0b7](https://github.com/mission-apprentissage/tables-correspondances/commit/527f0b76ddbb8b92971c410fa1ee8f46337561d2))
* tags ([f324fb4](https://github.com/mission-apprentissage/tables-correspondances/commit/f324fb4a295fd7cc3321064349601853dc137ffc))
* uai not required in etablissement service ([#73](https://github.com/mission-apprentissage/tables-correspondances/issues/73)) ([7548cf3](https://github.com/mission-apprentissage/tables-correspondances/commit/7548cf3757adddca4362c9de3f86f9bb5b08a66f))


### Features

* **bcn:** add queryAsRegex experimental ([#87](https://github.com/mission-apprentissage/tables-correspondances/issues/87)) ([86477b3](https://github.com/mission-apprentissage/tables-correspondances/commit/86477b335ea73e381b6e70b8e0633ab3c3095010))
* **cfd:** return outdated boolean value ([#91](https://github.com/mission-apprentissage/tables-correspondances/issues/91)) ([8038efa](https://github.com/mission-apprentissage/tables-correspondances/commit/8038efa10520d4b3d8531380ad7d9ed821fa4970))
* add conventionFilesImporter in jobs ([cc8dced](https://github.com/mission-apprentissage/tables-correspondances/commit/cc8dcedf9d84fff406af785e92871c4bb8763ac5))
* improve es:index script ([1168851](https://github.com/mission-apprentissage/tables-correspondances/commit/11688510919476464a6211052611b65be83771d6))
* update mapping cfd/niveau ([#85](https://github.com/mission-apprentissage/tables-correspondances/issues/85)) ([f328f91](https://github.com/mission-apprentissage/tables-correspondances/commit/f328f916700e837791acf465cdb4b28a082bb9ad))
* **opcos:** add opcos data to cfd handler ([21f5acc](https://github.com/mission-apprentissage/tables-correspondances/commit/21f5accb1fa9ad42e73227759c3c3989e16d2ad5))
* oneshot script remove duplicate ([#68](https://github.com/mission-apprentissage/tables-correspondances/issues/68)) ([481bec5](https://github.com/mission-apprentissage/tables-correspondances/commit/481bec50da74a1a68e74d33a726255ec550a291b))
* update ofs file ([0ec911b](https://github.com/mission-apprentissage/tables-correspondances/commit/0ec911b295fa8525d8d8fdd1f18f1c519fc77a18))


### Performance Improvements

* faster findOpcosFromCfd using distinct ([#82](https://github.com/mission-apprentissage/tables-correspondances/issues/82)) ([b11606e](https://github.com/mission-apprentissage/tables-correspondances/commit/b11606e5c784c888af66b626d8b0af0e969d998a))


### BREAKING CHANGES

* mandatory init before using

* feat: rncp importer

* wip : refacto rncp

* feat: make rncp work again

* fix: lint

# [1.2.0](https://github.com/mission-apprentissage/tables-correspondances/compare/v1.1.0...v1.2.0) (2021-02-03)


### Features

* dummy ([10352b9](https://github.com/mission-apprentissage/tables-correspondances/commit/10352b9a31cd86fb1f3526dfd42bccf0492c51fd))
