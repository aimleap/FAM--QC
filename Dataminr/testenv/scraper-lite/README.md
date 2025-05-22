# Scraper-Lite

This is a lightweight web scraper platform for development of custom parsers. 

## Requirements
- Install [nvm](https://github.com/nvm-sh/nvm).
- Install Nodejs with `nvm install node`.

## Installation
- Clone repo to local machine.
- `npm install` will install all dependencies.

## Development
- Run `npm run babel:watch` in one terminal tab. It will transpile TypeScript code under `dist/` and watch for file changes.
- `npm run create` will create a new source file under `src/sources/` using the specified parser template and source name.

## Testing
`npm run test [sourcename]` will run the parser by the name `sourcename` and output scraped data.  
If `sourcename` is omitted, you can choose a source to test from the menu. 
