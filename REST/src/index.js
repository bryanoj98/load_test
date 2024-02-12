const express = require('express');

const app = express();
app.use(express.json());

app.listen(process.env.PORT || 4000, function () {
  console.log('Your node js server is running')
})

app.get("/status", (request, response) => {
  const status = {
     "Status": "Running"
  };
  response.status(200).send(status);
  // response.send(status);
});