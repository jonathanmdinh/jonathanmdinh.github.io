require('dotenv').config()
const cors = require('cors')
const express = require('express')
const app = express()

app.use(cors())
const corsOptions = {
  origin: 'https://www.freecodecamp.org',
  optionsSuccessStatus: 204
}

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

/* ===== */

app.use(express.urlencoded({
  extended: true
}))

const {ObjectId} = require('mongodb');

const mongoose = require('mongoose');
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;

const exTrackerUserSchema = new Schema({
  username: { type: String, required: true, unique: true }
});

const exTrackerExerciseSchema = new Schema({
  user_id: { type: ObjectId, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: new Date() }
});

let ExTrackerUser = mongoose.model('ExTrackerUser', exTrackerUserSchema);

let ExTrackerExercise = mongoose.model('ExTrackerExercise', exTrackerExerciseSchema);

/* ===== */

const validateFormUsers = (req, res, next) => {
  if (req.body.username.match(/^[\w\-]+$/) === null) {
    return res.json({ 'error': `username must only contain letters, numbers, hyphens and underscore` });
  }
  next();
}

const createUser = (req, res, next) => {
  ExTrackerUser.findOne({ username: req.body.username }, function (err, result) {
    if (err) return console.log(err);
    if (result) {
      return res.json({ 'error': `username already exists with ID ${result._id}` });
    }
    const newUser = new ExTrackerUser({
      username: req.body.username
    });
    newUser.save(function(err, entry) {
      if (err) return console.error(err);
      req.newUser = { '_id': ObjectId(entry._id), 'username': entry.username };
      console.log();
      next();
    });
  });
}

app.post('/api/users', cors(corsOptions), validateFormUsers, createUser, (req, res) => {
  res.json(req.newUser);
});

/* === */

const validateFormExercises = (req, res, next) => {
  if (!req.params._id || req.params._id.match(/^[0-9a-fA-F]{24}$/) === null) {
    return res.json({ 'error': `user id (':_id') must consist of 24 letters and numbers` });
  }
  if (!req.body.description) {
    return res.json({ 'error': `'description' must not be empty` });
  }
  if (!req.body.duration || req.body.duration.match(/^\d+$/) === null) {
    return res.json({ 'error': `'duration' must be a number` });
  }
  if (req.body.date && req.body.date.match(/^\d{4}\-\d{2}\-\d{2}$/) === null) {
    return res.json({ 'error': `'date' must be a date of format YYYY-MM-DD` });
  }
  next();
}

const createExercise = (req, res, next) => {
  ExTrackerUser.findOne({ _id: req.params._id }, function (err, user) {
    if (err) return console.log(err);
    if (!user) {
      return res.json({ 'error': `user does not exist with ID ${req.params._id}` });
    }
    const newExercise = new ExTrackerExercise({
      user_id: ObjectId(req.params._id),
      description: req.body.description,
      duration: req.body.duration,
    });
    if (req.body.date) {
      newExercise.date = req.body.date;
    }
    newExercise.save(function(err, entry) {
      if (err) return console.error(err);
      req.newExercise = { '_id': ObjectId(user._id), 'username': user.username, 'description': entry.description, 'duration': entry.duration, 'date': entry.date.toDateString() };
      next();
    });
  });
}

app.post('/api/users/:_id/exercises', cors(corsOptions), validateFormExercises, createExercise, (req, res) => {
  res.json(req.newExercise);
});

/* ===== */

const getUsers = (req, res, next) => {
  ExTrackerUser.find().select({ username: 1, _id: 1 }).exec(function (err, result) {
    if (err) return console.log(err);
    req.users = result;
    next();
  });
};

app.get('/api/users/', cors(corsOptions), getUsers, (req, res) => { 
  res.json(req.users);
}); 

/* === */

const validateQueryLogs = (req, res, next) => {
  if (req.query.from && req.query.from.match(/^\d{4}\-\d{2}\-\d{2}$/) === null) {
    return res.json({ 'error': `query 'from' must be a date of format YYYY-MM-DD` });
  }
  if (req.query.to && req.query.to.match(/^\d{4}\-\d{2}\-\d{2}$/) === null) {
    return res.json({ 'error': `query 'to' must be a date of format YYYY-MM-DD` });
  }
  if (req.query.limit && req.query.limit.match(/^\d+$/) === null) {
    return res.json({ 'error': `query 'limit' must be a number` });
  }
  next();
}

const getLogs = (req, res, next) => {  
  const queryLimit = req.query.limit || 0;
  const logFilter = { user_id: req.params._id };
  if (req.query.from || req.query.to) {
    logFilter.date = {};
  }
  if (req.query.from) {
    logFilter.date.$gt = req.query.from;
  }
  if (req.query.to) {
    logFilter.date.$lt = req.query.to;
  }

  ExTrackerUser.findOne({ _id: req.params._id }, function (err, user) {
    if (err) return console.log(err);
    if (!user) {
      return res.json({ 'error': `user does not exist with ID ${req.params._id}` });
    }
    ExTrackerExercise.find(logFilter)
      .select({ description: 1, duration: 1, date: 1, _id: 0 })
      .limit(parseInt(queryLimit))
      .exec(function (err, result) {
        if (err) return console.log(err); 
        req.userResult = user;
        req.logsResult = result;
        next();
    });
  });
}

const formatLogs = (req, res, next) => {
  const logEntries = [];
  req.logsResult.forEach(entry => {
    logEntries.push({
      description: entry.description,
      duration: entry.duration,
      date: entry.date.toDateString()
    });
  });
  req.logs = { 
    _id: ObjectId(req.userResult._id), 
    username: req.userResult.username, 
    count: req.logsResult.length,
    log: logEntries 
  };
  next();
}

app.get('/api/users/:_id/logs', cors(corsOptions), validateQueryLogs, getLogs, formatLogs, (req, res) => { 
  res.json(req.logs);
}); 
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
