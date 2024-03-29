#!/bin/sh 
k6 run REST.js
k6 run Websocket.js
k6 run gRPC.js