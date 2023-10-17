# Optiversal Dashboard

The Optiversal Dashboard is for customers to manage and generage content. See more documentation at [docs/wiki/Dashboard](https://github.com/optiversal/docs/wiki/Dashboard).


## Development

The simplest way to get a running development server is through docker compose. 

- Install [docker desktop](https://www.docker.com/products/docker-desktop/) or [Rancher Desktop](https://rancherdesktop.io). Either of these will provide the tools necessary to boot this stack.


## Configure your environment.

The docker compose environment will use values from a `.env.compose` file. 
Create a `.env.compose` file with the following values (replace placeholders with credentials obtained from bitwarden).
A complete .env.compose file is available in bitwarden.

.env.compose
```
STAGE=dev
SEARCH_SERVICE=https://hss.stg.optiversal.com
GOOGLE_ANALYTICS_TRACKING_ID=UA-123456789-1
OPENAI_API_KEY=${OPENAI_API_KEY}
# CLIENT-SIDE ENVIRONMENT VARS
HOTJAR_ID=123456
AUTH0_SECRET=${AUTH0 DEV APPLICATION AUTH SECRET}
AUTH0_BASE_URL='https://dev.optiversal.com' # dev.optiversal.com by default, can use any value you have a cert for.  
REACT_APP_AUTH0_DOMAIN=dev-bt4esqrx.us.auth0.com
AUTH0_ISSUER_BASE_URL='https://auth.stg.optiversal.com'
AUTH0_CLIENT_ID=${AUTH0 CLIENT ID}
AUTH0_CLIENT_SECRET=${AUTH0 CLIENT SECRET}
ENABLE_SSO=true
AUTH0_API_ISSUER_BASE_URL='https://dev-bt4esqrx.us.auth0.com'
AUTH0_API_CLIENT_ID=${AUTH0 CLIENT ID}
AUTH0_API_CLIENT_SECRET=${AUTH0 CLIENT SECRET}
PAGE_PREVIEW_BUCKET_PATH=https://s3.amazonaws.com/preview-stg.devops.optiversal.com
NEXT_PUBLIC_PAGE_PREVIEW_BUCKET_PATH=https://s3.amazonaws.com/preview-stg.devops.optiversal.com
```

Ping the #engineering channel in slack to obtain these values over bitwarden.


Once you have this configuration complete, setup the `dev.optiversal.com` certificate on your machine. 

https://support.apple.com/guide/keychain-access/add-certificates-to-a-keychain-kyca2431/mac

https://betterprogramming.pub/how-to-create-trusted-ssl-certificates-for-your-local-development-13fd5aad29c6



Now, run `docker compose up` to bootstrap a local copy of the optiversal portal for development.
