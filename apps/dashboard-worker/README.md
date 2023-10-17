# dashboard-worker app

## Overview

The `dashboard-worker` app is general purpose background service that can be
used to off-load tasks from the main next.js web api service. Currently, the
dashboard-worker app handles processing of messaging from a pg-boss queue for
the automated workflow features, but is intended to be extended for other
features.

The `dashboard-worker` app requires two database connections.


The first is required by [`pgBoss`][pgBoss] to store queued jobs. `pgBoss`
manages it's own database schema for queue state. Before starting the worker,
ensure `PG_BOSS_DB_URL` connection string is set. The docker-compose environment
provides a local database for development.

    docker compose up -d postgres

The second is the dashboard database. The dashboard-worker app uses the same
shared code library as dashboard, and can be configured with the same db
connection parameters. (e.g. `DB_HOST`, `DB_USER`, etc)

Additional environment settings are used by shared code with the dashboard app.
Relevant env settings are noted in the [.env.example](./.env.example) file.

[pgBoss]: https://github.com/timgit/pg-boss/blob/master/docs/readme.md

## Quick Start for a Automated Workflows Local Demo

Install dependencies:

    npm i

Use the docker compose environment to start the `pgboss` database and
`dashboard-worker` job.

    docker compose up --build -d

Enable the feature for one or more organizations (e.g. the Demo Org). Add the
following to your `.env`:

    NEXT_PUBLIC_AUTOMATED_WORKFLOW_ENABLED_ORG_IDS="orgId1,orgId2"

Run the dashboard app:

    npm run dev

Then, visit your `/workflow` page and configure a Product type workflow.

## Development

See [README.app.md](../../README.apps.md) for general apps overview on building,
running, watching for changes, and building docker images.
