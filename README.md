# Load test protocols
## Commands
Run local test:

    k6 run Websocket.js
    k6 run gRPC.js 
    k6 run REST.js 
Run local and upload results to k6 cloud or Grafana:

    k6 run --out cloud REST.js


