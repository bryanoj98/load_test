const express = require("express");
const path = require('path')
const fs = require("fs");

const app = express();
const port = 3100;

// Servir archivos estáticos (como el HTML)
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'))
});

// REST
app.get("/latenciaREST", (req, res) => {
  fs.readFile("../latenciaAVGTotal-REST-FINAL.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error al leer el archivo de latencia.");
    }
    res.json(JSON.parse(data));
  });
});
app.get("/cpu-memoryREST", (req, res) => {
  fs.readFile("../cpuMemoryUsage-REST.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error al leer el archivo de CPU y memoria.");
    }
    res.json(JSON.parse(data));
  });
});

// WEBSOCKET
app.get("/latenciaWebsocket", (req, res) => {
  fs.readFile("../latenciaAVGTotal-WEBSOCKET-FINAL.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error al leer el archivo de latencia.");
    }
    res.json(JSON.parse(data));
  });
});
app.get("/cpu-memoryWebsocket", (req, res) => {
  fs.readFile("../cpuMemoryUsage-WEBSOCKET.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error al leer el archivo de CPU y memoria.");
    }
    res.json(JSON.parse(data));
  });
});

// gRPC
// app.get("/latenciaGRPC", (req, res) => {
//   fs.readFile("../latenciaAVGTotal-gRPC-FINAL.json", "utf8", (err, data) => {
//     if (err) {
//       return res.status(500).send("Error al leer el archivo de latencia.");
//     }
//     res.json(JSON.parse(data));
//   });
// });
app.get("/latenciaGRPC", (req, res) => {
  fs.readFile("../latenciaAVGTotal-gRPC.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error al leer el archivo de latencia.");
    }
    res.json(JSON.parse(data));
  });
});
app.get("/cpu-memoryGRPC", (req, res) => {
  fs.readFile("../cpuMemoryUsage-gRPC.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error al leer el archivo de CPU y memoria.");
    }
    res.json(JSON.parse(data));
  });
});

//SERVERs
app.get("/cpu-memoryRESTServer", (req, res) => {
  fs.readFile("../cpuMemoryUsage-REST-Server-FINAL.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error al leer el archivo de CPU y memoria.");
    }
    res.json(JSON.parse(data));
  });
});

app.get("/cpu-memoryGRPCServer", (req, res) => {
  fs.readFile("../cpuMemoryUsage-gRPC-Server-FINAL.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error al leer el archivo de CPU y memoria.");
    }
    res.json(JSON.parse(data));
  });
});

app.get("/cpu-memoryWebsocketServer", (req, res) => {
  fs.readFile("../cpuMemoryUsage-Websocket-Server-FINAL.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error al leer el archivo de CPU y memoria.");
    }
    res.json(JSON.parse(data));
  });
});
// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});