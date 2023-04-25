const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const personSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
});

const exerciseSchema = mongoose.Schema({
  user_id: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String },
})

let User = mongoose.model('User', personSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  } catch (e) {
    console.error(e);
  }
}

const checkDate = (date) => {
  return (!date) ? new Date(Date.now()).toDateString() : Date(date).toDateString();
}

app.post('/api/users', (req, res) => {
  connect();
  const username = req.body.username;
  User.create({ username: username }, (err, userData) => {
    err ? console.error(err) : res.json({ "username": userData.username, "_id": userData._id })
  });
});

app.get('/api/users', (req, res) => {
  connect();
  User.find({}, (err, data) => {
    !data ? res.json('No users found') : res.json(data);
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  connect();
  const body = req.body;
  const date = checkDate(req.body.date);
  User.findById(req.params._id).exec((err, user) => {
    Exercise.create({ user_id: user._id, description: body.description, duration: body.duration, date: date }, (err, data) => {
      err ? console.error(err) : res.json({
        "_id": user._id,
        "username": user.username,
        "date": data.date,
        "duration": data.duration,
        "description": data.description,
      });
    });
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  connect();
  var { from: startDate, to: endDate, limit: maximun } = req.query;

  User.findById(req.params._id).exec((err, user) => {
    Exercise.find({ utc: { $gte: startDate, $lte: endDate }, user_id: user._id }).limit(maximun).select({ user_id: 0 }).exec((err, documents) => {
      err ? console.error(err) : res.json({
        "_id": user._id,
        "username": user.username,
        "count": documents.length,
        "log": documents
      });
    });
  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
