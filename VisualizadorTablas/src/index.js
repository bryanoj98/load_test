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

// Ruta para leer latenciaAVGTotal.json
app.get("/latencia", (req, res) => {
  fs.readFile("../latenciaAVGTotal.json", "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error al leer el archivo de latencia.");
    }
    res.json(JSON.parse(data));
  });
});

// Ruta para leer cpuMemoryUsage.json
app.get("/cpu-memory", (req, res) => {
  fs.readFile("../cpuMemoryUsage.json", "utf8", (err, data) => {
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