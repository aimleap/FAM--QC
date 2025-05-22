# Web Scraper

This is Data Integration Platform previously known as Web Scraping Platform. This platform supports web scraping via Cheerio and Puppeteer (Headless browsing),  and API integration with various 3rd party vendors. 

### 1. Requirements
- Nodejs v16+ (use [nvm](https://github.com/nvm-sh/nvm) to manage your Nodejs version)
- [Tor Proxy](https://2019.www.torproject.org/docs/tor-doc-unix.html.en) or `brew install tor`
- [Docker on Mac](https://hub.docker.com/editions/community/docker-ce-desktop-mac)
- [Keeper](https://docs.keeper.io/secrets-manager/commander-cli/overview)

### 2. Installation
- `npm install`

### 3. Configuration for Keeper Vault & Application
- Create `config/keeper.json` for keeper vault with proper credential
```
{
  "user": "<username>",
  "password": "<password>"
}
```
*** you can give it a dummy cred value, if you don't interact with Keeper Vault
- Copy `config/default.json` to `config/local.json` and fill missing values

### 4. Setup AWS Credential
*** if you have aws cred config in your local machine, you can skip this step

Add these lines into your bash config
```
export AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID> 
export AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
```

### 5. Run Deduper (Optional)

For E2E testing, Otherwise, you can check out the console log & output.json in your project root directory

Follow README.MD in [Deduper](https://git.dataminr.com/web-crawling/deduper)

### 6. Create `src/sources/dev.ts` for local development & testing

For example on how to test Arlington parser

```javascript
import * as Arlington from '../spiders/sources/EA/Arlington';

export async function getDevParsers() {
  return [
    Arlington,
  ];
}
```

### 7. How to run it locally
- `docker-compose up` in one terminal tab
- `npm run babel:watch` in one terminal tab
- `tor -f tor/torrc` in one terminal tab
- `npm run dev` in one terminal tab


## Resources

- This project uses [babel](https://babeljs.io/) to transpile javascript source code into `dist` directory, therefore, it would support ES6/7/8 syntax. 
- [nodemon](https://www.npmjs.com/package/nodemon) enables hot reload in default while developing

### Project Structure
```text
.
├── bin                     # binary script files to initialize environment proxies
├── config                   # various configurations for the platform
├── coverage                # generated coverage report for unit testing
├── dist                    # transpiled build files from src
├── node_modules            # node js library packages
├── rundeck                 # RunDeck manifest files for deployment
└── src
    └── constants           # constant, enum files for the application
    └── libs                # util function files for various services, modules
    └── routes              # express js API routes for the platform
    └── schema              # internal schema, model files
    └── sources             # sources enablement by category
    └── spiders             
        └── frameworks      # common util functions for frameworks
        └── parsers         # common parser implementations for the platform
        └── sources         # source scraping code
    └── constants           # constant, enum files for the application
    └── app.ts              # application main entry file (Orchestrator)  
    └── scheduler.ts        # main task scheduler file
└── tmp                     # generated temp files for Local Stack (Aws tech stack Emulator)
└── tor                     # tor proxy config
└── .babelrc                # babel config file for transpile code
└── .eslintrc               # eslint config file for static code analysis
└── .gitlab-ci.yml          # GitLab CI/CD jobs
└── .prettierrc             # prettier config file for code formatting
└── docker-compose.yml      # docker compose config file
└── Dockerfile               # docker build file for deployment
└── nodemon.json            # hot reload config file
└── package.json            # node js package json file
└── tsconfig.json            # typescript config file
```


### Local Development (Playground)
You can create a `src/playground.ts` file in your local machine, and to execute this file `nodemon dist/playground.js`. This file won't be run against typescript/eslint, and checked in.

### Local Metrics (StatSD)
- [Metrics](https://github.com/samuelebistoletti/docker-statsd-influxdb-grafana/tree/2.3.0)
- [Chronograf](http://localhost:3004) login: root/root
- [Grafana](http://localhost:3003) login: root/root

## Troubleshooting
If you have some issues into running some package CLI in your terminal, and you might need to set these variables in your bash profile
```
 export PATH=$PATH:./node_modules/.bin
 export NODE_ENV='development'
```  

### Puppeteer
Puppeteer requires a working version of Chrome Browser, therefore, you need to make sure that chrome is working properly in your machine

[Puppeteer Environment Variables](https://github.com/GoogleChrome/puppeteer/blob/v1.18.0/docs/api.md#environment-variables)

[Puppeteer Troubleshooting](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md)

