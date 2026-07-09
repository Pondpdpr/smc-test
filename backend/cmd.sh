#!/bin/bash

# Exit script on any error
set -e

# Load .env variables if .env file exists
if [ -f ./.env ]; then
  export $(grep -v '^#' .env | xargs)
fi

function rand() {
  openssl rand -hex 32
}

function up() {
  docker-compose -f ../docker-compose.yml up -d
}

function down() {
  docker-compose -f ../docker-compose.yml down --remove-orphans
}

function waitpg() {
  ./scripts/wait-pg.sh
}

function repl() {
  nest start --entryFile repl --watch
}

function cli() {
  NODE_ENV=cli node -r tsconfig-paths/register -r @swc-node/register ./src/cli.ts $@
}

function db:type() {
  kysely-codegen --out-file ./src/infra/db/db.ts
}

function db:make() {
  npx kysely migrate:make $1
}

function db:up() {
  npx kysely migrate:latest
  db:type
  dbml
}

function db:prev() {
  npx kysely migrate:down
  db:type
}

function db:drop() {
  docker-compose -f ../docker-compose.yml up -d postgres
  docker-compose -f ../docker-compose.yml exec postgres dropdb -U postgres --if-exists postgres --force
  docker-compose -f ../docker-compose.yml exec postgres createdb -U postgres postgres
}

function dbml() {
  npx db2dbml postgres "$DATABASE_URL" -o schema.dbml
}

function db:reset() {
  db:drop
  db:up
}

function db:init() {
  db:reset
  npm run cli initials:seed
}

# Only run this after cloning project
function initproject() {
  cat .env.example > .env
  up
  npm i
}

command=$1
shift  # Remove the command name from the arguments

if declare -f "$command" > /dev/null; then
  "$command" "$@"
else
  echo "Command '$command' does not exist."
  exit 1
fi