const express = require('express');
const bodyParser = require('body-parser');
const os = require('os');

const app = express();

app.use(bodyParser.text({ type: '*/*' }));
app.use(express.json());

// const HOST = '192.168.10.8'; 
const PORT = process.env.PORT || 4000;

// Función para obtener la IP local
function getLocalIp() {
  const networkInterfaces = os.networkInterfaces();
  for (const [interfaceName, interfaces] of Object.entries(networkInterfaces)) {
    for (const networkInterface of interfaces) {
      if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
        return networkInterface.address;
      }
    }
  }
  return 'No local IP found';
}

app.listen(PORT, function () {
  const localIp = getLocalIp();
  console.log(`Your node.js server is running on http://${localIp}:${PORT}`);
})

// app.get("/status", async (request, response) => {
//   console.log("llega:",request.query)
//   // await sleep(10000)
//   const status = {
//      "Status": "Running"
//   };
//   response.status(200).send(status);
//   // response.send(status);
// });

app.post("/status", async (request, response) => {
  // console.log("request.body:",request.body);
  console.log("request.body:",request.body.length);
  // await sleep(10000)
  // const status = {
  //    "Status": "Running"
  // };
  response.status(200).send(request.body);
  // response.send(status);
});


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}