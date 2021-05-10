var express = require('express');
var app = express();
var bodyParser = require("body-parser");

app.use(function(req, res, next) {
  console.log(req.method + " " + req.path + " - " + req.ip);
  next();
});

console.log("Hello World");

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

app.use("/public", express.static(__dirname + "/public"));

app.get("/json", (req, res) => {
  if (process.env.MESSAGE_STYLE === "uppercase") {
    res.json (
      { "message": "HELLO JSON" }
    ) 
  } else {
    res.json (
      { "message": "Hello json" }
    )
  }
});

app.get(
  '/now',
   function(req, res, next) {
    req.time = new Date().toString();
    next();
  }, 
  function(req, res) {
    res.json({ time: req.time })
  }
);

app.get("/:word/echo", function(req, res) {
  var word = req.params.word;
  res.json({ echo: word });
});

app.get("/name", function(req, res){
  var firstName = req.query.first;
  var lastName = req.query.last;

  res.json({
    name: `${firstName} ${lastName}`
  });
});

app.use(bodyParser.urlencoded({ extended: false }));

app.post("/name", function(req, res){
 var firstName = req.body.first;
  var lastName = req.body.last;
res.json({
    name: `${firstName} ${lastName}`
  });
});






























module.exports = app;
