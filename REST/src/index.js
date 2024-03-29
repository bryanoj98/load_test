const express = require('express');

const app = express();
app.use(express.json());

app.listen(process.env.PORT || 4000, function () {
  console.log('Your node js server is running')
})

app.get("/status", async (request, response) => {
  console.log("llega:",request.query)
  await sleep(10000)
  const status = {
     "Status": "Running"
  };
  response.status(200).send(status);
  // response.send(status);
});


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}