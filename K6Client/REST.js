import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1s', target: 20 },
    { duration: '58s', target: 20 },
    { duration: '1s', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:4000/status');
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
