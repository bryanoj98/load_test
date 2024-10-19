const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader")

const os = require('os');
const fs = require("fs");
const systemInfo = require("./utilidades/systemInfo");
const arrayOperations = require("./utilidades/arrayOperations");

let cpuMemoryUsage = [];
let payloadSizes = []; // Arreglo para almacenar los tamaños de payloads
let monitoringInterval;
let numberOfThreads = "1";
const monitorTime = 1000;

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

var packageDef = protoLoader.loadSync("tesisNHilos.proto", options);
const grpcObject = grpc.loadPackageDefinition(packageDef);

const server = new grpc.Server();

server.addService(grpcObject.CommunicationService.service,
  {
      "transferInformation": transferInformation,
      "monotorON": monotorON,
      "monotorOFF": monotorOFF,
      "numberThread": numberThread
  });

function transferInformation (call, callback) {
  const data = call.request;
  // console.log("request.body:",data.payload.length);
  payloadSizes.push(data.payload.length);

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

  const resultCPUnRAM = arrayOperations.filterData(cpuMemoryUsage);

  fs.writeFileSync(
    "../cpuMemoryUsage-gRPC-Server.json",
    JSON.stringify(resultCPUnRAM, null, 2),
  );
  const data = {
    payload: "OFF"
  };

  callback(null, data);
}

function numberThread (call, callback) {
  const data = call.request;
  console.log("numberThread: ", data.payload);
  
  numberOfThreads = data.payload;

  const response = {
    payload: "OK"
  };

  callback(null, response);
}

function monitorUsage(monitorTime) {
  monitoringInterval = setInterval(() => {
    const cpuUsage = os.loadavg(); // Promedio de carga del CPU por núcleos
    const cpuPorcen = systemInfo.getCpuUsage(); // Porcentaje total de uso de CPU
    const memoryUsage = process.memoryUsage(); // Uso de memoria
    
    // Promediar los tamaños de payloads recibidos en el intervalo
    const averagePayloadSize = payloadSizes.length > 0
      ? Math.max(...payloadSizes)
      : 0;

    cpuMemoryUsage.push({
      timestamp: Date.now(),
      cpu: cpuPorcen,
      cpuNucleos: cpuUsage,
      memory: {
        rss: memoryUsage.rss // Resident Set Size
      },
      averagePayloadSize: averagePayloadSize, // Tamaño promedio del payload
      nOfThreads: numberOfThreads
    });

    // Limpiar el arreglo para el siguiente intervalo
    payloadSizes = [];
  }, monitorTime); // Monitorea en milisegundos
}

//Local
server.bindAsync("127.0.0.1:50000", grpc.ServerCredentials.createInsecure(), (error, port) => {
  server.start();
  console.log(`listening on port ${port}`);
  });

//Server
// server.bindAsync("10.42.0.40:50000", grpc.ServerCredentials.createInsecure(), (error, port) => {
//   server.start();
//   console.log(`listening on port ${port}`);
//   });