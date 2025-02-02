# Elecom Windows Signage Player

## Pre-requisites

1. Node.js v12 or later
2. Git
3. Yarn

## Install

First, clone the repo via git and install dependencies:

```
lang=bash
git clone https://phabricator.sprasia.jp/diffusion/225/elecom-windows-signage.git elecom-windows-signage
# -- or --
git clone ssh://vcs@phabricator.sprasia.jp/diffusion/225/elecom-windows-signage.git elecom-windows-signage

cd elecom-windows-signage
```

Install dependencies with `yarn`:

```
lang=bash
yarn install
```

## Starting Development

Start the app in the `dev` environment. This starts the renderer process in [**hot-module-replacement**](https://webpack.js.org/guides/hmr-react/) mode and starts a webpack dev server that sends hot updates to the renderer process:

```
lang=bash
yarn start
```

## Packaging for Production

To package apps for the local platform:

```
lang=bash
yarn package
```

This will generates `.exe` installer in `/release` folder in root directory.

You can debug your production build with devtools by simply setting the `DEBUG_PROD` env variable

```
lang=bash
yarn cross-env DEBUG_PROD=true yarn package
```

## Building for Static Web Page

To build static page for Content Editor preview and Android Signage app:

```
lang=bash
yarn build:static
```

This will generates `/out` folder in root directory.

## TypeORM CLI

NOTE: The `typeorm-cli` command can only be executed inside `/app` directory.

#### Auto-generate entity:

```
lang=bash
yarn typeorm-cli entity:create -n UserEntity
```

This will generates new entity in `main/entities` folder.
Then, add the newly created entity to entity list in `main/db/entities`.

#### Create new migration:

```
lang=bash
yarn typeorm-cli migration:create -n CreateUserTable
```

#### Auto-generate migration file with schema (entity) changes you made:

```
lang=bash
yarn typeorm-cli migration:generate -n RenameColumn
```

This will generates new migration in `main/migrations` folder.
Then, add the newly created migration to migration list in `main/db/migrations`.

#### Run pending migrations:

```
lang=bash
yarn typeorm-cli migration:run
```

#### Execute `down` in the latest executed migration:

```
lang=bash
yarn typeorm-cli migration:revert
```

Full documentation of [TypeORM](https://typeorm.io/#/).

## TODO

1. Enable auto-restart (NOT hot reload) in main process when file changes.

## Troubleshooting

### Python was not found but can be installed from the Microsoft store...

Execute the command below with administrative privileges:

```
lang=bash
npm install --global windows-build-tools
```

### DriverPackageNotInstalledError: SQLite package has not been found installed. Try to install it: npm install sqlite3 --save...

Execute the command below in root directory:

```
lang=bash
electron-builder install-app-deps
```

If the error still persists, re-install `sqlite3` inside `/app` directory:

```
lang=bash
yarn remove sqlite3
yarn add sqlite3@4.2.0
```

## License

MIT © [Electron React Boilerplate](https://github.com/electron-react-boilerplate)
