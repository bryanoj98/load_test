const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader")

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

var packageDef = protoLoader.loadSync("tesis.proto", options);
const grpcObject = grpc.loadPackageDefinition(packageDef);

const server = new grpc.Server();

server.addService(grpcObject.CommunicationService.service,
  {
      "transferInformation": transferInformation
  });

function transferInformation (call, callback) {
  const data = call.request;
  console.log("request.body:",data.payload.length);

  callback(null, data);
}

server.bindAsync("127.0.0.1:50000", grpc.ServerCredentials.createInsecure(), (error, port) => {
  server.start();
  console.log(`listening on port ${port}`);
  });