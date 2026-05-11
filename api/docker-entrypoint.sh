#!/bin/sh
set -e
# Assure que le schéma est à jour (nouvelle base ou nouveau conteneur Postgres)
npx prisma migrate deploy
exec node dist/main.js
