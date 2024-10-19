const grpc = require("@grpc/grpc-js");

exports.serverMonitorOFF = async (url, CommunicationService) => {
  const client = new CommunicationService(
    url,
    grpc.credentials.createInsecure(),
  );

  const respuesta = await new Promise((resolve, reject) => {
    const message = { payload: "ON" };

    client.monotorOFF(message, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
  console.log("respuesta Monitor: ", respuesta);
};

exports.serverMonitorON = async (url, CommunicationService) => {
  const client = new CommunicationService(
    url,
    grpc.credentials.createInsecure(),
  );

  const respuesta = await new Promise((resolve, reject) => {
    const message = { payload: "OFF" };

    client.monotorON(message, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
  console.log("respuesta Monitor: ", respuesta);
};

exports.sendNumberOfThreads = async (url, CommunicationService, nHilos) => {
  const client = new CommunicationService(
    url,
    grpc.credentials.createInsecure(),
  );

  const respuesta = await new Promise((resolve, reject) => {
    const message = { payload: String(nHilos) };

    client.numberThread(message, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
  console.log("respuesta nHilos: ", respuesta);
};

exports.gRPCIncremento = async (
  url,
  hiloId,
  payload,
  CommunicationService,
  maxPayloadSize,
  cycleSleepTime,
  duracionTest,
  parentPort,
) => {
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

    dataToSend = dataToSend + payload;
    await sleep(cycleSleepTime);
  }
  parentPort.postMessage({ hiloId, latenciaAVG: latenciaAVG });

  parentPort.postMessage({ hiloId, mensaje: "Termina hilo." });
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
