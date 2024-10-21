import { WebSocketServer } from 'ws';

import os from 'os';
import fs from 'fs';

import {getCpuUsage} from "./utilidades/systemInfo.js"; // Asegúrate de que la extensión .js esté incluida
import { filterData } from "./utilidades/arrayOperations.js";

let cpuMemoryUsage = [];
let payloadSizes = []; // Arreglo para almacenar los tamaños de payloads
let monitoringInterval;
let numberOfThreads = "1";
const monitorTime = 1000;

const wss = new WebSocketServer({ port: 8080 });
const wss2 = new WebSocketServer({ port: 8585 });

wss.on('connection', function connection(ws) {

  ws.on('message', function message(data) {
    // console.log("Servidor 1");
    // console.log('received: %s', data.length);
    payloadSizes.push(data.length);
    ws.send(data);//Envia
  });
 
  ws.on('close', () => {
    console.log('Conexión cerrada');
  });

  ws.on('error', (error) => {
    console.error('Error en la conexión:', error.message);
  });

});

wss2.on('connection', function connection(ws2) {

  ws2.on('message', function message(data) {
    let dataJson = data.toString('utf-8');
    dataJson = JSON.parse(dataJson);
    console.log("LEGGGGAA: ",dataJson);

    switch (dataJson.type) {
      case "MONITOR":
        console.log("Entra a monitor");
        
        if(dataJson.value == "ON"){
          console.log("monitorUsage: ON");
          monitorUsage(monitorTime);
    
          ws2.send("ON");//Envia
        }
        else if (dataJson.value == "OFF") {
          console.log("monitorUsage: OFF");
    
          clearInterval(monitoringInterval);
          console.log("cpuMemoryUsage: ", cpuMemoryUsage);
          

          const resultCPUnRAM = filterData(cpuMemoryUsage);
          console.log("resultCPUnRAM: ", resultCPUnRAM);
          
    
          fs.writeFileSync(
            "../cpuMemoryUsage-Websocket-Server.json",
            JSON.stringify(resultCPUnRAM, null, 2),
          );
    
          ws2.send("OFF");//Envia
        }
        break;
      case "THREADS":

        console.log("numberThread: ", dataJson.value);

        numberOfThreads = dataJson.value;
  
        ws2.send("OK");//Envia
        break;  
      default:
        break;
    }
    
  });
 
  ws2.on('close', () => {
    console.log('Conexión cerrada');
  });

  ws2.on('error', (error) => {
    console.error('Error en la conexión:', error.message);
  });

});

function monitorUsage(monitorTime) {
  monitoringInterval = setInterval(() => {
    const cpuUsage = os.loadavg(); // Promedio de carga del CPU por núcleos
    const cpuPorcen = getCpuUsage(); // Porcentaje total de uso de CPU
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
