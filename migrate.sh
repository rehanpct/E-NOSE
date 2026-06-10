#!/bin/bash
docker compose exec backend flask db init
docker compose exec backend flask db migrate -m "Initial schema"
docker compose exec backend flask db upgrade
