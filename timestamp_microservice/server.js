// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

//The response depends on the URL. If the API endpoint is hit with no additional //information, it returns the JSON with the current time.

app.get('/api/', (req, res) => {
  let date = new Date();
  res.json({ unix: date.valueOf(), utc: date.toUTCString() });
});

// your first API endpoint... 
app.get("/api/:inputstring", function (req, res) {
  let input = req.params.inputstring; //gets the :inputstring wildcard value.
  //Check that it is a date string
  if(input.match(/\d{5,}/)) {
    input = +input;
  }

  //checks for invalid dates
  let date = new Date(input); //date = wildcard value, inputstring
  if (date.toString() == "Invalid Date") {
    res.json({error: "Invalid Date"});
  }
    res.json({ unix: date.valueOf(), utc: date.toUTCString() }); //outputs the valid date.
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
