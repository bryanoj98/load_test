const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
const { log } = require("console");

const arrayOperations = require("./utilidades/arrayOperations");
const systemInfo = require("./utilidades/systemInfo");
const restCall = require("./service/restCall");
const gRPCCall = require("./service/gRPCCall");
const websocketCall = require("./service/websocketCall");

const os = require("os");
const fs = require("fs");

const packageDef = protoLoader.loadSync("tesisNHilos.proto", {});
const CommunicationService =
  grpc.loadPackageDefinition(packageDef).CommunicationService;

/*
  Seleccione el tamaño minimo de la carga util:
*/
const payload = require("./mensages/payload"); //payload2000
// const payload = require("./mensages/payload4000");
// const payload = require("./mensages/payload5000");
// const payload = require("./mensages/payload100kB");

/* 
  Seleccione el protocolo a utilizar en la prueba:
  Tipos de protocolos posibles: "REST" "WEBSOCKET" "gRPC"
*/
const tipoDePeticion = "REST"; // protocolo a utilizar
const isAscending = true; // Test ascendente o desendente
const duracionTest = 2000; // Tiempo durante el cual se envian peticiones
const cycleSleepTime = 2000; // Tiempo de reposo antes de continuar con el siguiente envio de peticiones
const monitorTime = 1000; // Intervalo de medicion uso de CPU y RAM en el cliente

/*
  Si isAscending == True:
  entonces el test es incremental y es neceario configurar los parametros: 
  maxNumThreads: Numero de hilos maximo al que llegara el test
  payload: Carga util inicial y a la que ira incrementando
*/
const maxPayloadSize = 10000; // Tamaño maximo de la carga util a la que llegara la prueba
const maxNumThreads = 2; // Numero maximo de hilos (usuarios recurrentes) a la que llegara le prueba

/*
  Si isAscending == false:
  entonces el test es decremental y es neceario configurar los parametros: 
  maxNumThreads: Numero de hilos inicial
  minNumThreads: Numero de hilos final
  payload: Se recomienda elegir payload100kB
  decrement: El valor de decremento del payload
  
  **Si isAscending no es relevante el valor de decrement y minNumThreads
*/
const decrement = 5000;
const minNumThreads = 48;


/* 
  Apuntamiento servidor local
*/
const urlRest = "http://localhost:4000";
const urlgRPC = "localhost:50000";
const ipWSocket = "ws://localhost";

/* 
  Apuntamiento servidor remoto
*/
/*const urlRest = "http://10.42.0.40:4000";
const urlgRPC = "10.42.0.40:50000";
const ipWSocket = "ws://10.42.0.40";*/

const urlWSocket = `${ipWSocket}:8080`;
const urlWSocketMonitor = `${ipWSocket}:8585`;

let latenciaAVGRonda = [];
let latenciaAVGTotal = [];
let cpuMemoryUsage = [];
let monitoringInterval;

let payloadDescrement = payload.DATA;
if (!isAscending) {
  while (payloadDescrement.length < maxPayloadSize) {
    payloadDescrement = payloadDescrement + payload.DATA;
  }
}

if (isMainThread) {
  // Flujo de trabajo hilo padre
  (async () => {
    // Inicia monitoreo servidor
    await adminMonitorOnServer(true);

    // Comienza a monitorear CPU y memoria
    monitorUsage(monitorTime);

    if (isAscending) {
      await cicloAscendente();
    } else {
      await cicloDescendente();
    }

    // Detener el monitoreo al finalizar
    clearInterval(monitoringInterval);

    await adminMonitorOnServer(false);

    // console.log(
    //   "Final final latenciaAVGTotal: ",
    //   JSON.stringify(latenciaAVGTotal, null, 2),
    // );
    // console.log(
    //   "Uso de CPU y Memoria: ",
    //   JSON.stringify(cpuMemoryUsage, null, 2),
    // );

    // Guardar los resultados en archivos JSON
    let fileNameLatencia = `../latenciaAVGTotal-${tipoDePeticion}.json`;
    let fileNameCPUMemory = `../cpuMemoryUsage-${tipoDePeticion}.json`;

    if (!isAscending) {
      fileNameLatencia = `../latenciaAVGTotal-${tipoDePeticion}-Descenso.json`;
      fileNameCPUMemory = `../cpuMemoryUsage-${tipoDePeticion}-Descenso.json`;
    }

    fs.writeFileSync(
      fileNameLatencia,
      JSON.stringify(latenciaAVGTotal, null, 2),
    );
    fs.writeFileSync(
      fileNameCPUMemory,
      JSON.stringify(cpuMemoryUsage, null, 2),
    );

    console.log("Fin del proceso... ");
  })();
} else {
  // Flujo de trabajo hilos hijos
  ejecutarHilo(workerData);
}

async function cicloAscendente() {
  let numeroDeHilos = 1; //Ascendente
  //let numeroDeHilos = minNumThreads; //Ascendente arranque alto
  while (numeroDeHilos <= maxNumThreads) {
    console.log("numeroDeHilos: ", numeroDeHilos);

    await sendNumberOfThreadsToServer(numeroDeHilos); //Enviar numero de hilos proximo al servidor

    await lanzarHilos(numeroDeHilos);

    let latenciaAVG = arrayOperations.calculateAverages(latenciaAVGRonda);

    latenciaAVGTotal.push({ [numeroDeHilos]: latenciaAVG });
    // console.log(
    //   "latenciaAVGTotal: ",
    //   JSON.stringify(latenciaAVGTotal, null, 2),
    // );
    latenciaAVGRonda = [];

    numeroDeHilos++;
  }
}

async function cicloDescendente() {
  let numeroDeHilos = maxNumThreads;
  while (numeroDeHilos > 0) {
    console.log("numeroDeHilos: ", numeroDeHilos);

    await sendNumberOfThreadsToServer(numeroDeHilos); //Enviar numero de hilos proximo al servidor

    await lanzarHilos(numeroDeHilos);

    let latenciaAVG =
      arrayOperations.calculateAveragesDecrement(latenciaAVGRonda);

    latenciaAVGTotal.push({ [numeroDeHilos]: latenciaAVG });
    // console.log(
    //   "latenciaAVGTotal: ",
    //   JSON.stringify(latenciaAVGTotal, null, 2),
    // );
    latenciaAVGRonda = [];

    numeroDeHilos--;
  }
}

// Función principal para lanzar los hilos
function lanzarHilos(numeroDeHilos) {
  return new Promise((resolve) => {
    let hilosActivos = 0;
    for (let i = 0; i < numeroDeHilos; i++) {
      const worker = new Worker(__filename, { workerData: { hiloId: i + 1 } });
      hilosActivos = hilosActivos + 1;

      worker.on("message", (resultado) => {
        if (resultado.latenciaAVG) {
          // console.log("resultado.latenciaAVG: ", resultado.latenciaAVG);

          latenciaAVGRonda = arrayOperations.addPartialValues(
            latenciaAVGRonda,
            resultado.latenciaAVG,
          );

          // console.log("latenciaAVGRonda: ", latenciaAVGRonda);
          hilosActivos = hilosActivos - 1;

          if (hilosActivos <= 0) {
            resolve(true);
          }
        }
      });
    }
  });
}

// Función para monitorear el uso de CPU y memoria
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
        rss: memoryUsage.rss, // Resident Set Size
      },
    });
  }, monitorTime); // Monitorea en milisegundos
}

// Función para el hilo del trabajador
function ejecutarHilo(workerData) {
  const { hiloId } = workerData;
  switch (tipoDePeticion) {
    case "REST":
      console.log("Inicio Cliente REST");
      if (isAscending) {
        // rest(urlRest, hiloId);
        restCall.restIncremento(
          urlRest,
          hiloId,
          payload.DATA,
          maxPayloadSize,
          cycleSleepTime,
          duracionTest,
          parentPort,
        );
      } else {
        restCall.restDecremeto(
          urlRest,
          hiloId,
          payloadDescrement,
          decrement,
          cycleSleepTime,
          duracionTest,
          parentPort,
        );
      }
      break;
    case "WEBSOCKET":
      console.log("Inicio Cliente WEBSOCKET");
      websocketCall.websocketIncremento(
        urlWSocket,
        hiloId,
        payload.DATA,
        maxPayloadSize,
        cycleSleepTime,
        duracionTest,
        parentPort,
      );
      // websocket(urlWSocket, hiloId);
      break;
    case "gRPC":
      console.log("Inicio Cliente gRPC");
      gRPCCall.gRPCIncremento(
        urlgRPC,
        hiloId,
        payload.DATA,
        CommunicationService,
        maxPayloadSize,
        cycleSleepTime,
        duracionTest,
        parentPort,
      );
      break;
    default:
      console.log("Tipo de peticion invalida");
      break;
  }
}

// Funcion Iniciar el monitor en el servidor
async function adminMonitorOnServer(isStart) {
  switch (tipoDePeticion) {
    case "REST":
      if (isStart) {
        await restCall.serverMonitorON(urlRest);
      } else {
        await restCall.serverMonitorOFF(urlRest);
      }
      break;
    case "WEBSOCKET":
      if (isStart) {
        await websocketCall.serverMonitorON(urlWSocketMonitor);
      } else {
        await websocketCall.serverMonitorOFF(urlWSocketMonitor);
      }
      break;
    case "gRPC":
      if (isStart) {
        await gRPCCall.serverMonitorON(urlgRPC, CommunicationService);
      } else {
        await gRPCCall.serverMonitorOFF(urlgRPC, CommunicationService);
      }
      break;
    default:
      console.log("Tipo de peticion invalida");
      break;
  }
}

//Enviar numero de hilos proximo al servidor
async function sendNumberOfThreadsToServer(nHilos) {
  switch (tipoDePeticion) {
    case "REST":
      await restCall.sendNumberOfThreads(urlRest, nHilos);
      break;
    case "WEBSOCKET":
      await websocketCall.sendNumberOfThreads(urlWSocketMonitor, nHilos);
      break;
    case "gRPC":
      gRPCCall.sendNumberOfThreads(urlgRPC, CommunicationService, nHilos);
      break;
    default:
      console.log("Tipo de peticion invalida");
      break;
  }
}
