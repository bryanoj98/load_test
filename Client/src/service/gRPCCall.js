const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const packageDef = protoLoader.loadSync("tesisMonitor.proto", {});
const CommunicationService =
  grpc.loadPackageDefinition(packageDef).CommunicationService;



exports.serverMonitorOFF = async (url) => {
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

exports.serverMonitorON = async (url) => {
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
