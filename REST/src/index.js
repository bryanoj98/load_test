const express = require('express');
// const bodyParser = require('body-parser');
const os = require('os');
const fs = require("fs");

const systemInfo = require("./utilidades/systemInfo");

const app = express();

// app.use(bodyParser.text({ type: '*/*' }));
// app.use(express.json());
app.use(express.text({ limit: '10mb' })); 

// const HOST = '192.168.10.8'; 
const PORT = process.env.PORT || 4000;

let cpuMemoryUsage = [];
let monitoringInterval;
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
  // console.log("request.length:",new TextEncoder().encode(request.body).length);
  // console.log("request.body:",request);

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

  fs.writeFileSync(
    "../cpuMemoryUsage-REST-Server.json",
    JSON.stringify(cpuMemoryUsage, null, 2),
  );
  
  response.send("OFF");
});

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