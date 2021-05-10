require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser")
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const dns = require('dns');
const urlparser = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true,
useUnifiedTopology: true });
console.log(mongoose.connect.readyState);

const schema = new mongoose.Schema({ url: 'string'});
const Url = mongoose.model('Url', schema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false}));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const links = [];
let id = 0;

// post new original link then return short link
app.post('/api/shorturl/', (req, res) => {
  // destructuring url
  const { url } = req.body

  // remove http(s) with regex
  // const noHTTPSurl = url.replace(/^https?:\/\//, '');
  function getDomain(url) {
    let result
    let match
    if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) {
        result = match[1]
        if (match = result.match(/^[^\.]+\.(.+\..+)$/)) {
            result = match[1]
        }
    }
    return result
  }
  const domainOnly = getDomain(url)
  console.log(domainOnly)

  // check if the url is valid
  dns.lookup(domainOnly, (err) => {
    if(err) {
      res.json({
        "error": 'invalid URL'
      })
    } else {
      // increment the id 
      id++;

      // create url data
      const link = {
        original_url: url,

        short_url: `${id}`
      };
      links.push(link);
      
      return res.json({
        "original_url" : url,
        "short_url" : id
      });
    }
  })
})

app.get('/api/shorturl/:id', (req, res) => {
  const { id } = req.params;

  const result = links.find(l => l.short_url === id)

  if (result) {
    return res.redirect(result.original_url)
  } else {
    return res.json({
      error: 'No such URL'
    })
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});