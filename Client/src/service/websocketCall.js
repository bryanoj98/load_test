const WebSocket = require("ws");

exports.serverMonitorOFF = async (url) => {
  await serverMonitor(url, "OFF");
};

exports.serverMonitorON = async (url) => {
  await serverMonitor(url, "ON");
};

async function serverMonitor(url, data) {
  const ws = new WebSocket(url);

  ws.on("open", () => {
    const peticionesW = async () => {
      try {
        ws.send(data);

        await esperarRespuesta(); // Esperar la respuesta del servidor
      } catch (error) {
        console.error("Error en la comunicacion con el servidor: ", error);
      }

      ws.close();
    };

    const esperarRespuesta = () => {
      return new Promise((resolve, reject) => {
        ws.once("message", (mensaje) => {
          console.log("respuesta Monitor: ", mensaje);

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
  });
}
