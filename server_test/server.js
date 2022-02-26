var express = require('express');
var bodyParser = require('body-parser');
var app = express();

//Allow all requests from all domains & localhost
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.post('/bets/', function(req, res) {
    console.log(req.body);
    res.status(201).send({"status":"SUCCESS","desc":"OK","username":"0969822525","credit":"136098.20","create_at":"2022-02-22T21:37:21.769215752+07:00"});
});

app.listen(10000);
