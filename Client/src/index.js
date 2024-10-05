const axios = require("axios");
const WebSocket = require("ws");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
const { log } = require("console");

// const payload = require("./mensages/payload");
// const payload = require("./mensages/payload4000");
// const payload = require("./mensages/payload5000");
const payload = require("./mensages/payload100kB");

const arrayOperations = require("./utilidades/arrayOperations");
const systemInfo = require("./utilidades/systemInfo");
const restCall = require("./service/restCall");
const gRPCCall = require("./service/gRPCCall");
const websocketCall = require("./service/websocketCall");

const os = require("os");
const fs = require("fs");

const packageDef = protoLoader.loadSync("tesisMonitor.proto", {});
const CommunicationService =
  grpc.loadPackageDefinition(packageDef).CommunicationService;

/* Tipos de peticiones posibles:
  "REST" "WEBSOCKET" "gRPC"
*/
const tipoDePeticion = "REST";
const duracionTest = 2000;
const maxPayloadSize = 500000;
// const maxPayloadSize = 6000;
const maxNumThreads = 3;
// const maxNumThreads = 1;
const cycleSleepTime = 2000;
const decrement = 2000;

const monitorTime = 1000;

// const urlRest = "http://localhost:4000";
// const urlgRPC = "localhost:50000";
// const ipWSocket = "ws://localhost"
const urlRest = "http://10.42.0.40:4000";
const urlgRPC = "10.42.0.40:50000";
const ipWSocket = "ws://10.42.0.40";

const urlWSocket = `${ipWSocket}:8080`;
const urlWSocketMonitor = `${ipWSocket}:8585`;

let latenciaAVGRonda = [];
let latenciaAVGTotal = [];
let cpuMemoryUsage = [];
let monitoringInterval;

if (isMainThread) {
  // Flujo de trabajo hilo padre
  (async () => {
    // Inicia monitoreo servidor
    await adminMonitorOnServer(true);

    // Comienza a monitorear CPU y memoria
    monitorUsage(monitorTime);

    let numeroDeHilos = 1; //Ascendente
    // let numeroDeHilos = maxNumThreads; //Descendente
    while (numeroDeHilos <= maxNumThreads) {
      //Ascendente
      // while (numeroDeHilos > 0) { //Descendente
      console.log("numeroDeHilos: ", numeroDeHilos);

      await lanzarHilos(numeroDeHilos);

      let latenciaAVG = arrayOperations.calculateAverages(latenciaAVGRonda);

      latenciaAVGTotal.push({ [numeroDeHilos]: latenciaAVG });
      // console.log(
      //   "latenciaAVGTotal: ",
      //   JSON.stringify(latenciaAVGTotal, null, 2),
      // );
      latenciaAVGRonda = [];

      numeroDeHilos++;
      // numeroDeHilos--; //DEcremento
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
    fs.writeFileSync(
      `../latenciaAVGTotal-${tipoDePeticion}-corto.json`,
      JSON.stringify(latenciaAVGTotal, null, 2),
    );
    fs.writeFileSync(
      `../cpuMemoryUsage-${tipoDePeticion}-corto.json`,
      JSON.stringify(cpuMemoryUsage, null, 2),
    );

    console.log("Fin del proceso... ");
  })();
} else {
  // Flujo de trabajo hilos hijos
  ejecutarHilo(workerData);
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
          console.log("resultado.latenciaAVG: ", resultado.latenciaAVG);

          latenciaAVGRonda = arrayOperations.addPartialValues(
            latenciaAVGRonda,
            resultado.latenciaAVG,
          );

          console.log("latenciaAVGRonda: ", latenciaAVGRonda);
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
      rest(urlRest, hiloId);
      break;
    case "WEBSOCKET":
      console.log("Inicio Cliente WEBSOCKET");
      websocket(urlWSocket, hiloId);
      break;
    case "gRPC":
      console.log("Inicio Cliente gRPC");
      gRPC(urlgRPC, hiloId);
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

// Función para realizar la petición REST
async function rest(url, hiloId) {
  const urlMsg = `${url}/status`;
  let dataToSend = "";
  let latenciaAVG = [];
  while (dataToSend.length <= maxPayloadSize) {
    const tiempoInicio = Date.now();
    let latenciaList = [];
    while (Date.now() - tiempoInicio < duracionTest) {
      try {
        // console.log(`uploadData:${dataToSend.length} byte(s). Hilo:${hiloId} `);

        const inicio = performance.now();
        const respuesta = await axios.post(urlMsg, dataToSend);
        const fin = performance.now();

        const latencia = fin - inicio;
        // console.log(`Latencia: ${latencia} ms`);

        latenciaList.push(latencia);
      } catch (error) {
        parentPort.postMessage({ hiloId, mensaje: error.message });
      }
    }
    const sumLatencias = latenciaList.reduce((acc, val) => acc + val, 0);

    let byteLength = dataToSend.length;
    latenciaAVG.push({
      [byteLength]: {
        sumLatencias: sumLatencias,
        numMuestras: latenciaList.length,
      },
    });

    dataToSend = dataToSend + payload.DATA;
    await sleep(cycleSleepTime);
  }

  parentPort.postMessage({ hiloId, latenciaAVG: latenciaAVG });

  parentPort.postMessage({ hiloId, mensaje: "Termino hilo" });
}

// Función para realizar la petición websocket
function websocket(url, hiloId) {
  const ws = new WebSocket(url);

  ws.on("open", () => {
    // parentPort.postMessage({
    //   hiloId,
    //   mensaje: "Conexión WebSocket abierta...",
    // });

    const peticionesW = async () => {
      let dataToSend = "";
      let latenciaAVG = [];

      while (dataToSend.length <= maxPayloadSize) {
        const tiempoInicio = Date.now();
        let latenciaList = [];
        while (Date.now() - tiempoInicio < duracionTest) {
          try {
            // console.log(
            //   `uploadData:${dataToSend.length} byte(s). Hilo:${hiloId} `,
            // );

            const inicio = performance.now();

            ws.send(dataToSend);

            await esperarRespuesta(); // Esperar la respuesta del servidor

            const fin = performance.now();
            const latencia = fin - inicio;
            latenciaList.push(latencia); // Almacenar la latencia
          } catch (error) {
            parentPort.postMessage({ hiloId, mensaje: error.message });
          }
        }
        const sumLatencias = latenciaList.reduce((acc, val) => acc + val, 0);

        let payloadSize2 = dataToSend.length;
        latenciaAVG.push({
          [payloadSize2]: {
            sumLatencias: sumLatencias,
            numMuestras: latenciaList.length,
          },
        });

        dataToSend += payload.DATA;
        await sleep(cycleSleepTime);
      }

      ws.close();
      parentPort.postMessage({ hiloId, latenciaAVG: latenciaAVG });

      parentPort.postMessage({ hiloId, mensaje: "Termino hilo" });
    };

    const esperarRespuesta = () => {
      return new Promise((resolve, reject) => {
        ws.once("message", (mensaje) => {
          // parentPort.postMessage({
          //   hiloId,
          //   mensaje: `Respuesta del servidor: ${mensaje}`,
          // });
          resolve();
        });
      });
    };

    peticionesW();
  });

  ws.on("close", () => {
    // parentPort.postMessage({ hiloId, mensaje: "Conexión WebSocket cerrada." });
  });

  ws.on("error", (error) => {
    parentPort.postMessage({ hiloId, mensaje: error.message });
  });
}

async function gRPC(url, hiloId) {
  const client = new CommunicationService(
    url,
    grpc.credentials.createInsecure(),
  );

  let dataToSend = "";
  let latenciaAVG = [];

  while (dataToSend.length <= maxPayloadSize) {
    const tiempoInicio = Date.now();
    let latenciaList = [];
    while (Date.now() - tiempoInicio < duracionTest) {
      // console.log(`uploadData:${dataToSend.length} byte(s). Hilo:${hiloId} `);
      const inicio = performance.now();

      const respuesta = await new Promise((resolve, reject) => {
        const message = { payload: dataToSend };

        client.transferInformation(message, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });

      const fin = performance.now();
      const latencia = fin - inicio;
      latenciaList.push(latencia);
    }

    const sumLatencias = latenciaList.reduce((acc, val) => acc + val, 0);

    let payloadSize2 = dataToSend.length;
    latenciaAVG.push({
      [payloadSize2]: {
        sumLatencias: sumLatencias,
        numMuestras: latenciaList.length,
      },
    });

    dataToSend = dataToSend + payload.DATA;
    await sleep(cycleSleepTime);
  }
  parentPort.postMessage({ hiloId, latenciaAVG: latenciaAVG });

  parentPort.postMessage({ hiloId, mensaje: "Termina hilo." });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
