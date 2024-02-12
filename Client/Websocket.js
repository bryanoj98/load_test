import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
    stages: [
      { duration: '30s', target: 20 },
      { duration: '1m30s', target: 10 },
      { duration: '20s', target: 0 },
    ],
  };
  
export default function () {
  const url = 'ws://localhost:8080';
  const params = { tags: { my_tag: 'hello' } };

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', () => console.log('connected'));
    socket.on('message', (data) => {
        console.log('Message received: ', data)
        socket.close();
    });
    socket.on('close', () => console.log('disconnected'));
    
    // socket.setTimeout(function () {
    //     console.log(`Closing the socket forcefully 3s after graceful LEAVE`);
    //     socket.close();
    //   }, 3000);
  });
  check(res, { 'status is 101': (r) => r && r.status === 101 });
}
