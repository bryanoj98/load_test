const WebSocket = require("ws");

exports.serverMonitorOFF = async (url) => {
  const dataToSend = {
    type: "MONITOR",
    value: "OFF",
  };
  await sendToServerActions(url, JSON.stringify(dataToSend));
};

exports.serverMonitorON = async (url) => {
  const dataToSend = {
    type: "MONITOR",
    value: "ON",
  };
  await sendToServerActions(url, JSON.stringify(dataToSend));
};

async function sendToServerActions(url, data) {
  const ws = new WebSocket(url);

  ws.on("open", () => {
    const peticionesW = async () => {
      try {
        ws.send(data);

        await esperarRespuesta(); // Esperar la respuesta del servidor

        ws.close();
      } catch (error) {
        console.error("Error en la comunicacion con el servidor: ", error);
        ws.close();
      }
    };

    const esperarRespuesta = () => {
      return new Promise((resolve, reject) => {
        ws.once("message", (mensaje) => {
          console.log("respuesta del Servidor: ", mensaje);

          resolve();
        });
      });
    };

    peticionesW();
  });

  ws.on("close", () => {
    console.log("Conexión WebSocket cerrada.");
  });

  ws.on("error", (error) => {
    console.error("Respuesta de error del servidor: ", error);
    ws.close();
  });
}

exports.sendNumberOfThreads = async (url, nHilos) => {
  const dataToSend = {
    type: "THREADS",
    value: String(nHilos),
  };
  await sendToServerActions(url, JSON.stringify(dataToSend));
};

// Función para realizar la petición websocket
exports.websocketIncremento = async (
  url,
  hiloId,
  payload,
  maxPayloadSize,
  cycleSleepTime,
  duracionTest,
  parentPort,
) => {
  const ws = new WebSocket(url);

  ws.on("open", () => {
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

        dataToSend += payload;
        await sleep(cycleSleepTime);
      }

      ws.close();
      parentPort.postMessage({ hiloId, latenciaAVG: latenciaAVG });
    };

    const esperarRespuesta = () => {
      return new Promise((resolve, reject) => {
        ws.once("message", (mensaje) => {
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
    ws.close();
  });
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
