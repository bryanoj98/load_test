import { WebSocketServer } from 'ws';
import si from "systeminformation";

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {

  ws.on('message', function message(data) {
    console.log('received: %s', data);

    ws.send('something');//Envia
  });
 
  ws.on('close', () => {
    console.log('Conexión cerrada');
  });

  ws.on('error', (error) => {
    console.error('Error en la conexión:', error.message);
  });

});