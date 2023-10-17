# Apps Tooling

The `apps/` directory contains standalone node server apps that share code (and
business logic) with the Dashboard Next.JS app.

- Next uses webpack & babel under the hood (?). Since creating top-level
  configuration files for these tools will interfere with Next's setup, a
  `*.server.*` convention is used.
- Versions of webpack and babel that are compatible with Next's are used for
  apps to standardize on build tools.
- Output is generated in dist/ (as opposed to .next/ for the Next app)

## Build and Run

Use `app:build`, `app:start`, or `app:start:watch` for app development, passing
in the directory name of the app. e.g. for `example` app:

```
npm run app:build example
npm run app:start:watch example
```

## Docker

`Dockerfile.apps` is generalize via build args for any app. e.g. for `example`
app:

```
docker build -t example-app --build-arg "APP_NAME=example" -f Dockerfile.apps .
```
