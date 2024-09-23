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
const payload = require("./mensages/payload");
const arrayOperations = require("./utilidades/arrayOperations");
const os = require("os");
const fs = require("fs");

const packageDef = protoLoader.loadSync("./books.proto", {});
const NewsService = grpc.loadPackageDefinition(packageDef).BooksService;

/* Tipos de peticiones posibles:
  "REST" "WEBSOCKET" "gRPC"
*/
const tipoDePeticion = "REST";
const duracionTest = 2000;
// const maxPayloadSize = 500000;
const maxPayloadSize = 6000;
const maxNumThreads = 4;
// const numeroDeHilos = 3;
const urlRest = "http://localhost:4000/status";
const urlWSocket = "ws://localhost:8080";
const urlgRPC = "localhost:50000";
let latenciaAVGRonda = [];
let latenciaAVGTotal = [];
let cpuMemoryUsage = [];
let monitoringInterval;


if (isMainThread) {
  // Flujo de trabajo hilo padre
  (async () => {
    // Comienza a monitorear CPU y memoria
    monitorUsage();

    let numeroDeHilos = 1;
    while (numeroDeHilos <= maxNumThreads) {
      console.log("numeroDeHilos: ", numeroDeHilos);

      await lanzarHilos(numeroDeHilos);
      latenciaAVGTotal.push({[numeroDeHilos]: latenciaAVGRonda});
      console.log("latenciaAVGTotal: ", JSON.stringify(latenciaAVGTotal, null, 2));
      latenciaAVGRonda = [];

      numeroDeHilos++;
    }

    // Detener el monitoreo al finalizar
    clearInterval(monitoringInterval);
    // await sleep(5000);
    console.log("Final final latenciaAVGTotal: ", JSON.stringify(latenciaAVGTotal, null, 2));
    console.log("Uso de CPU y Memoria: ", JSON.stringify(cpuMemoryUsage, null, 2));

     // Guardar los resultados en archivos JSON
     fs.writeFileSync("../latenciaAVGTotal.json", JSON.stringify(latenciaAVGTotal, null, 2));
     fs.writeFileSync("../cpuMemoryUsage.json", JSON.stringify(cpuMemoryUsage, null, 2));
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
          // if (numeroDeHilos == 4) {
          //   console.log("H4 = latenciaAVG: ", resultado.latenciaAVG);           
          // }
          latenciaAVGRonda = arrayOperations.sumAverages(
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
function monitorUsage() {
  monitoringInterval = setInterval(() => {
    const cpuUsage = os.loadavg(); // Promedio de carga del CPU
    const memoryUsage = process.memoryUsage(); // Uso de memoria

    cpuMemoryUsage.push({
      timestamp: Date.now(),
      cpu: cpuUsage,
      memory: {
        rss: memoryUsage.rss, // Resident Set Size
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
    });
  }, 500); // Monitorea en milisegundos
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
      Servicegrpc(urlgRPC, hiloId);
      break;
    default:
      console.log("Tipo de peticion invalida");
      break;
  }
}

// Función para realizar la petición REST
async function rest(url, hiloId) {
  let dataToSend = payload.DATA;
  let latenciaAVG = [];
  while (dataToSend.length <= maxPayloadSize) {
    const tiempoInicio = Date.now();
    let latenciaList = [];
    while (Date.now() - tiempoInicio < duracionTest) {
      try {
        // parentPort.postMessage({ hiloId, mensaje: "Lanza peticion" });
        // const respuesta = await axios.get(url+"?ID="+hiloId);

        console.log(`uploadData:${dataToSend.length} byte(s). Hilo:${hiloId} `);

        const inicio = performance.now();
        const respuesta = await axios.post(url, dataToSend);
        const fin = performance.now();

        const latencia = fin - inicio;
        // console.log(`Latencia: ${latencia} ms`);

        latenciaList.push(latencia);
      } catch (error) {
        parentPort.postMessage({ hiloId, mensaje: error.message });
      }
    }
    const promedioLatencia =
      latenciaList.reduce((acc, val) => acc + val, 0) / latenciaList.length;
    let payloadSize2 = dataToSend.length;
    latenciaAVG.push({ [payloadSize2]: promedioLatencia });

    dataToSend = dataToSend + payload.DATA;
    await sleep(5000);
  }
  // console.log("PPPPPPPP: ", String(latenciaAVG));
  // latenciaAVG.forEach(element => {
  // console.log("PPPPPPPP: ", JSON.stringify(element));

  // });

  parentPort.postMessage({ hiloId, latenciaAVG: latenciaAVG });

  parentPort.postMessage({ hiloId, mensaje: "Termino hilo" });
}

// Función para realizar la petición websocket
function websocket(url, hiloId) {
  const tiempoInicio = Date.now();
  const ws = new WebSocket(url);

  ws.on("open", () => {
    parentPort.postMessage({
      hiloId,
      mensaje: "Conexión WebSocket abierta...",
    });

    const peticionesW = async () => {
      let tiempoEjecucion = Date.now() - tiempoInicio;
      while (tiempoEjecucion < duracionTest) {
        try {
          parentPort.postMessage({
            hiloId,
            mensaje:
              "Tiempo Inicial: " +
              tiempoInicio +
              " tiempoEjecucion: " +
              tiempoEjecucion,
          });

          const message = {
            hiloId,
            msg: "hola",
          };
          ws.send(JSON.stringify(message));

          await esperarRespuesta();
        } catch (error) {
          parentPort.postMessage({ hiloId, mensaje: error.message });
        }
        tiempoEjecucion = Date.now() - tiempoInicio;
      }

      ws.close();
      parentPort.postMessage({ hiloId, mensaje: "Termino hilo" });
    };

    const esperarRespuesta = () => {
      return new Promise((resolve, reject) => {
        ws.once("message", (mensaje) => {
          parentPort.postMessage({
            hiloId,
            mensaje: `Respuesta del servidor: ${mensaje}`,
          });
          resolve();
        });
      });
    };

    peticionesW();
  });

  // ws.on('message', (mensaje) => {
  //   parentPort.postMessage({ hiloId, mensaje: `Respuesta del servidor: ${mensaje}` });
  // });

  ws.on("close", () => {
    parentPort.postMessage({ hiloId, mensaje: "Conexión WebSocket cerrada." });
  });

  ws.on("error", (error) => {
    parentPort.postMessage({ hiloId, mensaje: error.message });
  });
}

async function Servicegrpc(url, hiloId) {
  const tiempoInicio = Date.now();
  const client = new NewsService(url, grpc.credentials.createInsecure());

  while (Date.now() - tiempoInicio < duracionTest) {
    parentPort.postMessage({ hiloId, mensaje: "Lanza peticion" });

    const respuesta = await new Promise((resolve, reject) => {
      //Espera a que llegue la respuesta para enviar una nueva peticion

      client.allBooks({}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
    parentPort.postMessage({ hiloId, mensaje: JSON.stringify(respuesta) });
  }
  parentPort.postMessage({ hiloId, mensaje: "Termina hilo." });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
