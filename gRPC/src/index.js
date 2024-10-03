const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader")

const os = require('os');
const fs = require("fs");
const systemInfo = require("./utilidades/systemInfo");

let cpuMemoryUsage = [];
let monitoringInterval;
const monitorTime = 1000;

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

var packageDef = protoLoader.loadSync("tesisMonitor.proto", options);
const grpcObject = grpc.loadPackageDefinition(packageDef);

const server = new grpc.Server();

server.addService(grpcObject.CommunicationService.service,
  {
      "transferInformation": transferInformation,
      "monotorON": monotorON,
      "monotorOFF": monotorOFF
  });

function transferInformation (call, callback) {
  const data = call.request;
  // console.log("request.body:",data.payload.length);

  callback(null, data);
}

function monotorON (call, callback) {
  console.log("monitorUsage: ON");

  monitorUsage(monitorTime);
  const data = {
    payload: "ON"
  };

  callback(null, data);
}

function monotorOFF (call, callback) {
  console.log("monitorUsage: OFF");

  clearInterval(monitoringInterval);

  fs.writeFileSync(
    "../cpuMemoryUsage-gRPC-Server.json",
    JSON.stringify(cpuMemoryUsage, null, 2),
  );
  const data = {
    payload: "OFF"
  };

  callback(null, data);
}

function monitorUsage(monitorTime) {
  monitoringInterval = setInterval(() => {
    const cpuUsage = os.loadavg(); // Promedio de carga del CPU por nucleos
    const cpuPorcen = systemInfo.getCpuUsage(); // porcentaje total de uso de CPU
    const memoryUsage = process.memoryUsage(); // Uso de memoria

    cpuMemoryUsage.push({
      timestamp: Date.now(),
      cpu: cpuPorcen,
      cpuNucleos: cpuUsage,
      memory: {
        rss: memoryUsage.rss // Resident Set Size
      },
    });
  }, monitorTime); // Monitorea en milisegundos
}

server.bindAsync("127.0.0.1:50000", grpc.ServerCredentials.createInsecure(), (error, port) => {
  server.start();
  console.log(`listening on port ${port}`);
  });