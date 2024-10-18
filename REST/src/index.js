const express = require('express');
const bodyParser = require('body-parser');
const os = require('os');
const fs = require("fs");
const systemInfo = require("./utilidades/systemInfo");

const app = express();
app.use(bodyParser.text({ type: '*/*', limit: '50mb' }));
// app.use(express.text({ limit: '10mb' }));

const PORT = process.env.PORT || 4000;

let cpuMemoryUsage = [];
let payloadSizes = []; // Arreglo para almacenar los tamaños de payloads
let monitoringInterval;
let numberOfThreads = "1";
const monitorTime = 1000;

// Función para obtener la IP local
function getLocalIp() {
  const networkInterfaces = os.networkInterfaces();
  for (const [interfaceName, interfaces] of Object.entries(networkInterfaces)) {
    for (const networkInterface of interfaces) {
      if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
        return networkInterface.address;
      }
    }
  }
  return 'No local IP found';
}

app.listen(PORT, function () {
  const localIp = getLocalIp();
  console.log(`Your node.js server is running on http://${localIp}:${PORT}`);
})

app.post("/status", async (request, response) => {   
  // const sizepayload = request.body.length;

    // Almacenar el tamaño en la cola
    payloadSizes.push(request.body.length);
  
  

  // Enviar la respuesta al cliente
  response.send(request.body);
});

app.post("/monitorON", async (request, response) => {
  console.log("monitorUsage: ON");
  monitorUsage(monitorTime);
  response.send("ON");
});

app.post("/monitorOFF", async (request, response) => {
  console.log("monitorUsage: OFF");
  clearInterval(monitoringInterval);

  filterData();
  
  fs.writeFileSync(
    "../cpuMemoryUsage-REST-Server.json",
    JSON.stringify(cpuMemoryUsage, null, 2),
  );
  
  response.send("OFF");
});

app.post("/numberThread", async (request, response) => {
  console.log("numberThread: ", request.body);

  numberOfThreads = request.body;
  response.send("OK");
});

function monitorUsage(monitorTime) {
  monitoringInterval = setInterval(() => {
    const cpuUsage = os.loadavg(); // Promedio de carga del CPU por núcleos
    const cpuPorcen = systemInfo.getCpuUsage(); // Porcentaje total de uso de CPU
    const memoryUsage = process.memoryUsage(); // Uso de memoria

    // console.log("payloadSizes: ", payloadSizes);
    
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

function filterData() {

  // Filtrar objetos con averagePayloadSize = 0
  const filteredData = cpuMemoryUsage.filter(item => item.averagePayloadSize !== 0);

  // Función para promediar objetos con el mismo nOfThreads y averagePayloadSize
  const averagedData = filteredData.reduce((acc, item) => {
    const key = `${item.nOfThreads}-${item.averagePayloadSize}`;

    if (!acc[key]) {
      acc[key] = {
        ...item,
        count: 1
      };
    } else {
      acc[key].cpu = (parseFloat(acc[key].cpu) + parseFloat(item.cpu)).toString();
      acc[key].memory.rss += item.memory.rss;
      acc[key].count += 1;
    }

    return acc;
  }, {});

  // Calcular el promedio
  const result = Object.values(averagedData).map(item => {
    const averageCpu = (parseFloat(item.cpu) / item.count).toFixed(2);
    return {
      ...item,
      cpu: averageCpu,
      memory: { rss: Math.round(item.memory.rss / item.count) }, // Promediar rss
      count: undefined // eliminar el conteo del resultado final
    };
  });

  cpuMemoryUsage = result;
};