const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const personSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
});

const exerciseSchema = mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String }
})

let User = mongoose.model('User', personSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    console.log(mongoose.connection.readyState);
  } catch (e) {
    console.error(e);
  }
}

const checkDate = (date) => {
  if (typeof date === 'undefined') {
    return new Date(Date.now()).toDateString();
  } else {
    return new Date(date).toDateString();
  }
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
  const user = User.findById(req.params._id, (err, userFound) => { return userFound });
  const date = checkDate(body.date);
  Exercise.create({ description: body.description, duration: body.duration, date: body.date }, (err, data) => {
    err ? console.error(err) : res.json({
      "_id": user._id,
      "username": user.username,
      "date": date,
      "duration": data.duration,
      "description": data.description
    });
  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
