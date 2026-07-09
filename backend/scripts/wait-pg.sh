#!/bin/bash -e
# wait-for-postgres.sh
NEXT_WAIT_TIME=0
END_TIME=20

until docker-compose -f ../docker-compose.yml exec postgres pg_isready > /dev/null 2>&1; do
  if [ $NEXT_WAIT_TIME -eq $END_TIME ]; then 
    echo "Error: Timed out waiting for the postgres to start." >&2
    exit 1
  fi

  sleep 1
done