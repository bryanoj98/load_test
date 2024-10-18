const axios = require("axios");

exports.serverMonitorOFF = async (url) => {
  const urlMsg = `${url}/monitorOFF`;
  await serverMonitor(urlMsg);
};

exports.serverMonitorON = async (url) => {
  const urlMsg = `${url}/monitorON`;
  await serverMonitor(urlMsg);
};

async function serverMonitor(endpoint) {
  const respuesta = await axios.post(endpoint, {});
  console.log("respuesta Monitor: ", respuesta.data);
}

exports.sendNumberOfThreads = async (url, nHilos) => {
  const urlToSend = `${url}/numberThread`;
  const respuesta = await axios.post(urlToSend, String(nHilos));
  console.log("respuesta nHilos: ", respuesta.data);
};

exports.restDecremeto = async (
  url,
  hiloId,
  payloadDescrement,
  decrement,
  cycleSleepTime,
  duracionTest,
  parentPort,
) => {
  const urlStatus = `${url}/status`;
  let dataToSend = payloadDescrement;
  let latenciaAVG = [];

  while (dataToSend.length > 0) {
    const tiempoInicio = Date.now();
    let latenciaList = [];
    while (Date.now() - tiempoInicio < duracionTest) {
      try {
        // console.log(`uploadData:${dataToSend.length} byte(s). Hilo:${hiloId} `);

        const inicio = performance.now();
        const respuesta = await axios.post(urlStatus, dataToSend);
        const fin = performance.now();

        const latencia = fin - inicio;
        // console.log(`Latencia: ${latencia} ms`);

        latenciaList.push(latencia);
      } catch (error) {
        console.error("Error en la comunicacion con el servidor: ", error);
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

    dataToSend = dataToSend.slice(0, byteLength - decrement);
    await sleep(cycleSleepTime);
  }

  parentPort.postMessage({ hiloId, latenciaAVG: latenciaAVG });
};

exports.restIncremento = async (
  url,
  hiloId,
  payload,
  maxPayloadSize,
  cycleSleepTime,
  duracionTest,
  parentPort,
) => {
  const urlStatus = `${url}/status`;
  let dataToSend = "";
  let latenciaAVG = [];
  while (dataToSend.length <= maxPayloadSize) {
    const tiempoInicio = Date.now();
    let latenciaList = [];
    while (Date.now() - tiempoInicio < duracionTest) {
      try {
        // console.log(`uploadData:${dataToSend.length} byte(s). Hilo:${hiloId} `);

        const inicio = performance.now();
        const respuesta = await axios.post(urlStatus, dataToSend);
        const fin = performance.now();

        const latencia = fin - inicio;
        // console.log(`Latencia: ${latencia} ms`);

        latenciaList.push(latencia);
      } catch (error) {
        console.error("Error en la comunicacion con el servidor: ", error);
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

    dataToSend = dataToSend + payload;
    await sleep(cycleSleepTime);
  }

  parentPort.postMessage({ hiloId, latenciaAVG: latenciaAVG });
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
