# Load test protocols

## Prerequisites

You will need the following things properly installed on your computer.
 * [Git] (https://git-scm.com/)
 * [Node] (https://nodejs.org)
 * [NPM] (https://docs.npmjs.com)

## Installation

* `git clone git@github.com:bryanoj98/load_test.git` this repository
* change into the new directory `cd load_test`

**Select directory:**
* Client `cd Client`
* REST server `cd REST_server`
* Websocket server `cd websockets_server`
* gRPC server `cd gRPC_server`

## Dependencies

Run `npm install` to install project dependencies.

## Running test

Run `npm run test` to execute server or client test.

## Results

The results are recorded in the files:
**Server:**
* CPU and memory usage `cpuMemoryUsage-<protocol>.json`

**Client:**
* CPU and memory usage `cpuMemoryUsage-<protocol>-Server.json`
* Latency `latenciaAVGTotal-<protocol>.json`

## View
To view the results:
* Change into the directory `cd VisualizadorTablas`
* Run `npm install` to install project dependencies.
* Run `npm run test` to execute view server.
* Go to http://localhost:3100