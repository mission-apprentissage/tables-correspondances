#!/bin/sh

# A hook script to verify that we don't commit files that could contain sensible data or credentials like json, csv, xls(x) or .env

sensible_files_pattern="\.(csv|xls|xls(x?)|json|env)$"
exception="(dataDepartements.json|package.json|default.json|custom-environment-variables.json|manifest.json"
exception="$exception|codes_diplomes.v1.2.csv|rncp_blocs_competences.v1.2.csv|rncp_certificateurs.v1.2.csv|rncp_info.v1.2.csv|rncp_nsf.v1.2.csv|rncp_rome.v1.2.csv|rncp_voix_acces.v1.2.csv|rncp_blocs_competences.v1.2.csv|rncp_certificateurs.v1.2.csv"
exception="$exception|codes_diplomes.v1.3.csv|rncp_blocs_competences.v1.3.csv|rncp_certificateurs.v1.3.csv|rncp_info.v1.3.csv|rncp_nsf.v1.3.csv|rncp_rome.v1.3.csv|rncp_voix_acces.v1.3.csv|rncp_blocs_competences.v1.3.csv|rncp_certificateurs.v1.3.csv"
exception="$exception|codes_diplomes.v1.4.csv|rncp_blocs_competences.v1.4.csv|rncp_certificateurs.v1.4.csv|rncp_info.v1.4.csv|rncp_nsf.v1.4.csv|rncp_rome.v1.4.csv|rncp_voix_acces.v1.4.csv|rncp_blocs_competences.v1.4.csv|rncp_certificateurs.v1.4.csv"
exception="$exception|referentielCodesIdccOpco.csv"
exception="$exception|CFASousConvRegionale_latest.xlsx"
exception="$exception|CFASousConvRegionale_latest-UAI.csv"
exception="$exception|CodeDiplome_RNCP_latest_mna.csv"
exception="$exception|BaseDataDock-latest.csv"
exception="$exception|sample.json"
exception="$exception|tsconfig.base.json|tsconfig.json"
exception="$exception|CodeDiplome_RNCP_latest_kit.csv"
exception="$exception)$"

files=$(git diff --cached --name-only | grep -v -E "$exception" | grep -E "$sensible_files_pattern")
if [ -z "$files" ]; then
  exit 0
fi

echo
echo "ERROR: Preventing commit of potentially sensible files:"
echo
echo "$files" | sed "s/^/   /"
echo
echo "Either reset those files, add them to .gitignore or remove them."
echo
echo "If you know what you are doing, please double-check that you are not commiting"
echo "any credentials, password or sensible data and run git commit again with --no-verify."
echo
exit 1
