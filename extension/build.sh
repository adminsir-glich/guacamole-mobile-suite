#!/usr/bin/env bash
# Builds the guacamole-mobile-suite.jar extension
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_JAR="${SCRIPT_DIR}/../guacamole-mobile-suite.jar"

cd "${SCRIPT_DIR}"
zip -q -r "${OUTPUT_JAR}" guac-manifest.json mobile.js mobile.css

echo "Successfully built extension JAR:"
echo "-> ${OUTPUT_JAR}"
unzip -l "${OUTPUT_JAR}"
