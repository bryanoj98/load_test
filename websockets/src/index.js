import { WebSocketServer } from 'ws';

import os from 'os';
import fs from 'fs';


let cpuMemoryUsage = [];
let monitoringInterval;
const monitorTime = 1000;

const wss = new WebSocketServer({ port: 8080 });
const wss2 = new WebSocketServer({ port: 8585 });

wss.on('connection', function connection(ws) {

  ws.on('message', function message(data) {
    // console.log("Servidor 1");
    // console.log('received: %s', data.length);

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
    console.log("LEGGGGAA: ",data);
    
    if(data == "ON"){
      console.log("monitorUsage: ON");
      monitorUsage(monitorTime);

      ws2.send("ON");//Envia
    }
    else if (data == "OFF") {
      console.log("monitorUsage: OFF");

      clearInterval(monitoringInterval);

      fs.writeFileSync(
        "../cpuMemoryUsage-Websocket-Server.json",
        JSON.stringify(cpuMemoryUsage, null, 2),
      );

      ws2.send("OFF");//Envia
    }
    
  });
 
  ws2.on('close', () => {
    console.log('Conexión cerrada');
  });

  ws2.on('error', (error) => {
    console.error('Error en la conexión:', error.message);
  });

});

function getCpuUsage() {
  const cpus = os.cpus();

  const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const totalTick = cpus.reduce((acc, cpu) => acc + Object.values(cpu.times).reduce((a, b) => a + b, 0), 0);

  const totalUsed = totalTick - totalIdle;
  const usage = (totalUsed / totalTick) * 100;

  return usage.toFixed(2); // Retorna el uso de CPU con 2 decimales
}

function monitorUsage(monitorTime) {
  monitoringInterval = setInterval(() => {
    const cpuUsage = os.loadavg(); // Promedio de carga del CPU por nucleos
    const cpuPorcen = getCpuUsage(); // porcentaje total de uso de CPU
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