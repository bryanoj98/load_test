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

// async function restDecremeto(url, hiloId) {
//     // let dataToSend = "";
//     // let latenciaAVG = [];
//     // let byteLength = 0;

//     let dataToSend = payload.DATA;
//     let latenciaAVG = [];
//     // let byteLength = dataToSend.length;

//     // while (dataToSend.length <= maxPayloadSize) { //Ascendente
//     while (dataToSend.length > 0) { //descendente
//       const tiempoInicio = Date.now();
//       let latenciaList = [];
//       while (Date.now() - tiempoInicio < duracionTest) {
//         try {
//           // console.log(`uploadData:${dataToSend.length} byte(s). Hilo:${hiloId} `);

//           const inicio = performance.now();
//           const respuesta = await axios.post(url, dataToSend);
//           const fin = performance.now();

//           const latencia = fin - inicio;
//           // console.log(`Latencia: ${latencia} ms`);

//           latenciaList.push(latencia);
//         } catch (error) {
//           parentPort.postMessage({ hiloId, mensaje: error.message });
//         }
//       }
//       const sumLatencias = latenciaList.reduce((acc, val) => acc + val, 0);

//       let byteLength = dataToSend.length;
//       latenciaAVG.push({
//         [byteLength]: {
//           sumLatencias: sumLatencias,
//           numMuestras: latenciaList.length,
//         },
//       });

//       // dataToSend = dataToSend + payload.DATA; //Ascendente
//       dataToSend = dataToSend.slice(0, byteLength - decrement);
//       await sleep(cycleSleepTime);
//     }

//     parentPort.postMessage({ hiloId, latenciaAVG: latenciaAVG });

//     parentPort.postMessage({ hiloId, mensaje: "Termino hilo" });
//   }
