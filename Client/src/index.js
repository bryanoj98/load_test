const axios = require('axios');
const WebSocket = require('ws');
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const packageDef = protoLoader.loadSync("../books.proto", {});
const NewsService = grpc.loadPackageDefinition(packageDef).BooksService;

const tipoPeticion = 1;
const duracionTest = 60000;
const numeroDeHilos = 2;
const urlRest = 'http://localhost:4000/status';
const urlWSocket = 'ws://localhost:8080';
const urlgRPC ="localhost:50000";

// Función para realizar la petición REST
async function rest(url, hiloId) {
  const tiempoInicio = Date.now();
  while (Date.now() - tiempoInicio < duracionTest) {
    try {
      parentPort.postMessage({ hiloId, mensaje: "Lanza peticion" });
      const respuesta = await axios.get(url+"?ID="+hiloId);
      parentPort.postMessage({ hiloId, mensaje: respuesta.data });
    } catch (error) {
      parentPort.postMessage({ hiloId, mensaje: error.message });
    }
  }
  parentPort.postMessage({ hiloId, mensaje: 'Termino hilo' });
}

// Función para realizar la petición websocket
function websocket(url, hiloId) {
  const tiempoInicio = Date.now();
  const ws = new WebSocket(url);

  ws.on('open', () => {
    parentPort.postMessage({ hiloId, mensaje: 'Conexión WebSocket abierta...' });

    const peticionesW = async () => {
      let tiempoEjecucion = Date.now() - tiempoInicio;
      while (tiempoEjecucion < duracionTest) { 
        try {
          parentPort.postMessage({ hiloId, mensaje: 'Tiempo Inicial: '+tiempoInicio+" tiempoEjecucion: "+tiempoEjecucion });

          const message = {
            hiloId,
            msg: "hola"
          };
          ws.send(JSON.stringify(message));

          await esperarRespuesta();

        } catch (error) {
          parentPort.postMessage({ hiloId, mensaje: error.message });
        }
        tiempoEjecucion = Date.now() - tiempoInicio;
      }

      ws.close();
      parentPort.postMessage({ hiloId, mensaje: 'Termino hilo' });
    };

    const esperarRespuesta = () => {
      return new Promise((resolve, reject) => {
        ws.once('message', (mensaje) => {
          parentPort.postMessage({ hiloId, mensaje: `Respuesta del servidor: ${mensaje}` });
          resolve();
        });
      });
    };

    peticionesW();
  });

  

  // ws.on('message', (mensaje) => {
  //   parentPort.postMessage({ hiloId, mensaje: `Respuesta del servidor: ${mensaje}` });
  // });

  ws.on('close', () => {
    parentPort.postMessage({ hiloId, mensaje: 'Conexión WebSocket cerrada.' });
  });

  ws.on('error', (error) => {
    parentPort.postMessage({ hiloId, mensaje: error.message });
  });
}

async function Servicegrpc(url, hiloId) {
  const tiempoInicio = Date.now();
  const client = new NewsService(url, grpc.credentials.createInsecure());

  while (Date.now() - tiempoInicio < duracionTest) {
    parentPort.postMessage({ hiloId, mensaje: "Lanza peticion" });

    const respuesta = await new Promise((resolve, reject) => {  //Espera a que llegue la respuesta para enviar una nueva peticion

      client.allBooks({}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      })
    });
    parentPort.postMessage({ hiloId, mensaje: JSON.stringify(respuesta) });    
  }
  parentPort.postMessage({ hiloId, mensaje: 'Termina hilo.' });
}

// Función para el hilo del trabajador
function ejecutarHilo(workerData) {
  const { hiloId } = workerData;
  switch(tipoPeticion) {
    case 0:
      rest(urlRest, hiloId);
      break;
    case 1:
      websocket(urlWSocket,hiloId);
      break;
    case 2:
      Servicegrpc(urlgRPC,hiloId);
      break;
    default:
      console.log("Tipo de peticion invalida");
  }
}

// Función principal para lanzar los hilos
function lanzarHilos() {
  for (let i = 0; i < numeroDeHilos; i++) {
    const worker = new Worker(__filename, { workerData: { hiloId: i + 1 } });
    worker.on('message', (resultado) => {
      console.log(`Respuesta del hilo ${resultado.hiloId}:`, resultado.mensaje);
    });
  }
}

if (isMainThread) {
  // Flujo de trabajo hilo padre
  lanzarHilos();
} else {
  // Flujo de trabajo hilos hijos
  ejecutarHilo(workerData);
}

