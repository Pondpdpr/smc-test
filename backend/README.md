<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) project, is using primsa & kyselyDB ORM. NPM as package manager. This project is design to run as 2 entry point **main(api)** **worker(process task)**. Steps to perform deploy will is in Note section.

## Make SURE Your node version is the same as project
```json
"engines": {
    "node": "24.13.0",
    "npm": "11.6.2"
  },
```

## Quick Start
```bash
# Stop all running docker (incase conflicting port)
$ docker stop $(docker ps -q)

$ npm run cmd initproject

$ npm run cmd db:init

$ npm run dev
```

## API Documentation

[Swagger UI](http://localhost:3000/docs/swagger/)

[Bullboard](http://localhost:2999)

## Installation

```bash
$ npm i
```

## Running the app

```bash
# development & watch mode
$ npm run dev

# worker development & watch mode
$ npm run dev:worker
```

## Database Management
```bash
# new migrations (based on prisma sche changes)
$ npm run db:make

# run migrations
$ npm run db:up

# make and up together
$ npm run db:push

# reseting all migration and run seed
$ npm run db:init
```

## i18n
I use [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n?tab=readme-ov-file) for translating you can add your translation inside the language sub folder of [i18n](src/infra/i18n).

After adding translation run this command to generate the compiled translation.
```bash
$ npm run lang
```

To use just called the object globally
```ts
import L from '@/infra/i18n/i18n-node';

L.th.HI({ name: 'robert' })
```

**IMPORTANT ONLY TRANSLATE FOR REPORT ONLY**

Don't translate anything to Frontend, it'll cause confusion we're trying not to have UI logic in backend. We only communicate to frontend using code. *See more in notes at the bottom.*

## Test

**WE WILL MOSTLY DO E2E TEST**

With our workflow from my experience ON GET API we're better off doing e2e test, this will make sure our api will not fail.

We're using vitest for performing our test

### Test issue
If have issue with test container do this:
In ~/.docker/config.json, remove the below entry, and save:
```
{ // "credsStore": "desktop" // }
```

**ALL TEST RUN INSIDE TRANSACTION**

make sure to start every e2e test with this function.
```ts
app = await startTestApp(module);
```

You can do as many post or delete request as you want, it will rollback at the end of each this using.
```ts
afterAll(async () => {
    await endTestApp(app);
  });
```

**Running the test**

We don't care about test coverage score because it doesn't really help locate bug. **JUST MAKE SURE** every endpoint is tested.

```bash
# e2e test
$ npm run test
```

## Writing custom cli

You can write your own cli command. NestjsCommander has already been setup. You can follow the pattern of this folder *src/cli*.

```bash
# running custom cli
$ npm run cli ${name}

# example
$ npm run cli users:seed
```


## Other useful command

```bash
# developing react email
$ npm run dev:email

# running repl
$ npm run repl
```


## Note

### Let the Frontend Handle Presentation
**Avoid embedding UI logic in backend APIs**

It's tempting to design APIs specifically around how the frontend displays data — such as tailoring a response for a table view. However, this tightly couples backend logic to frontend presentation and limits reusability.

Instead, design APIs around business logic, not UI requirements.

**Design Principle**

A single endpoint like GET /users should serve multiple frontend use cases:
- Table view (e.g., pagination, sorting)
- Dropdowns (minimal fields like id, name)
- Modals or detailed views (full relational context)

The backend should expose a rich, normalized dataset, and let the frontend choose what and how to display it.

Use query parameters (e.g., ?include=roles,profile) to allow clients to request additional related resources. This pattern is standardized in [JSON API](https://jsonapi.org/examples/)

**Note**
- Frontend controls projection/filtering, not backend.
- Avoid building separate endpoints for each frontend view unless justified by distinct business operations.
- Query param-based expansion of relations keeps endpoints flexible and maintainable.

*If your app implements permission-based access control, be cautious. Always ensure only authorized fields and relations are exposed, regardless of frontend requests.*

### DB setup
- all db setup is inside [db.provider](src/infra/db/db.provider.ts) you can uncomment and add database replicas there

### DB transaction management

- I've already setup the repo to have a transaction method, you only need to wrap other repo functionality inside the callback

```ts
// Example from users.v1.service.ts
await this.transactionService.transaction(async () => {
  // this is inside transaction
  await this.service.updateUser(user);
});
```
- **Make sure that every write/read chain operation is inside transaction**
- **Make sure to await every method called inside transaction, or it will release before operation complete**
- I've wrapped operation inside transaction with try catch that will return a [**Res OBJECT**](#error-communication-using-key)
- Note: When using read replicas every operation inside transaction (even read) will be performed on the main DB. So make sure that read performed after write is inside transaction.

### Adding Queues & Worker
- To add new queue go into [domain/queue](src/domain/queue) and create a new folder following the pattern of [domain-event](src/domain/queue/domain-event)
- Then define your exchange/queue inside [worker.constant.ts](src/app/worker/worker.constant.ts)
- To add worker go to [worker folder](src/app/worker) and create using the same pattern as [domain-event](src/app/worker/domain-event/domain-event.amqp.ts)
- **IMPORTANT** make sure to link your worker with queue inside your new module
```ts
// Link users queue with UsersTaskHandler
createMqHandler(MQ_EXCHANGE.DOMAIN_EVENT.name, DomainEventAmqp)
```


### CI work flow
  - devops don't need to know about how to run test for our project so we have a script to handle that they just need to execute it.
  - devops to create a **SETUP pipeline** as shown here
    - steps (after open PR):
      - ./scripts/setup.sh merge
    - steps (before build):
      - ./scripts/setup.sh build
  - **IMPORTANT** on build step devops need to create .env file from repo env
    - echo $REPO_ENV > .env

  - **Bonus**: Integrating dbml with CI pipeline
    - there's an auto generated [dbml file](schema.dbml) inside your repo. I've integrate this with prisma migration. We can use this to generate [dbdocs](https://dbdocs.io/).
    - you can see inside [setup.sh](scripts/setup.sh) there's a function called _dbdoc() inside the build step.
    ```bash
    function build() {
        npm i
        npm run test
        # _dbdoc
    }
    ```
    - to use it and integrate your schema with [dbdocs](https://dbdocs.io/) just add $DBDOCS_TOKEN into your repo env
    - more info on how to get the token at [dbdocs ci integration](https://docs.dbdocs.io/features/ci-integration)

### CD (deployment) workflow
  - As said above our project is designed to be run as 2 app (api, worker) and we will also need to handle db migration, so we will follow these steps.
  #### 1. Handling server database migration
  - database migration is avaliable inside the image using command:
  ```bash
  # migrate DB
  $ docker run $image db:deploy
  ```
  - devops need to create a pipeline to handle DB migration before deploying the application
    - cicd workflow: **setup** -> **build** -> **deploy DB** -> **deploy app**
  #### 2. Deploying application
  - after image has been build and DB has been deployed the image need to be run with the following command (start api,worker)
  ```bash
  # run main app
  $ docker run $image start

  # run worker
  $ docker run $image start:worker
  ```
  #### Tradeoffs
  - when performing cicd this way there will be an application downtime tradeoff. After deploy DB pipeline finished. The feature that perform query on changed schema will break. (around 2-3mins depend on pipeline speed)
  - there's 2 ways to handle this issue:
    1. **Recommend** report client and everyone to stop using app before deploying.
    2. **If 1. option is really not avaliable** we need to handle migration script to allow backward compatability. Meaning you don't touch the column that old version uses.
        - example: if we want to rename column
          - first deploy changes that add new column (name that you want to change to)
          - new app will be deploy with the new column
          - then deploy again with the removed old column