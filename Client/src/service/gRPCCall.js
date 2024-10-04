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
