<h1 align="center">
  Edge Cloud Network Viewer
  <br>
  <br>
</h1>

<p align="center">
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="Standard - JavaScript Style Guide"></a>
</p>

# Production set up

The ECN-Viewer should be used as a node package with an Express server.
The ECN-Viewer package exposes a function that takes Express as an argument and returns a middleware that will serve the application.

## Install

`npm i @iofog/ecn-viewer`

## Usage

```js
const ecnViewer = require('@iofog/ecn-viewer')
const express = require('express')
...
app.use('/', ecnViewer.middleware(express))
```


# Development set up

This set up will get you going with an Express server that will proxy your requests to the configured ECN Controller, this is currently a work around CORS issues and is only suited for development purposes.

## Requirements

* [Node](https://nodejs.org/en/) 24.x LTS (>= 24.0.0)
* [NPM](https://www.npmjs.com/) (It will be installed alongside node)

Use [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm) to install and select Node 24: run `nvm use 24` in the project directory (see `.nvmrc`). To install nvm and Node 24, follow the [nvm documentation](https://github.com/nvm-sh/nvm#installing-and-updating).  
Note: NVM is a sourced script; you may need to load it in your shell session:
```sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
nvm use 24
```

**Platform notes:** Node 24 prebuilt binaries require macOS 13.5 or newer; 32-bit Linux (armv7) and 32-bit Windows (x86) are no longer supported.

## Usage

`npm run start-dev`

The script will use the config `./controller_dev.json`, to bundle the web application. The web application will use the controller information from the config file as its ECN Controller. (This can later on be modified through the web app, using the settings icon on the lateral nav bar.)

The web server will listen on the PORT env variable (or 80 by default).

### Config file

The configuration JSON file contains the informations required to connect to your ECN Controller.
```json
{
  "ip": "127.0.0.1",
  "port": "51121",
  "dev": true,
  "refresh": 3000,
  "user": {
    "email": "user@domain.com",
    "password": "#Bugs4Fun"
  }
}
```