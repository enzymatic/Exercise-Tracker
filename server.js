const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true });

///////////////models///////////////
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
  },
});

const UserModel = mongoose.model('User', UserSchema);

const ExerciseSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: new Date().toDateString,
  },
});

const ExerciseModel = mongoose.model('Exercise', ExerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/users', async (req, res) => {
  try {
    let inDatabase = await UserModel.find();

    res.json([...inDatabase]);
  } catch (error) {
    res.json({ error: 'something went wrong' });
  }
});

app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  let inDatabase;

  try {
    inDatabase = await UserModel.findOne({ username });
    if (inDatabase) {
      throw new Error('user exists with username');
    } else {
      inDatabase = new UserModel({ username });
      await inDatabase.save();

      console.log('inDatabase');
      console.log(inDatabase);

      res.send({
        username: inDatabase.username,
        _id: inDatabase._id,
      });
    }
  } catch (error) {
    res.json({ error: 'something went wrong' });
  }
});

app.post('/api/users/:_id?/exercises', async (req, res) => {
  let { _id, description, duration, date } = req.body;
  let inDatabase;

  console.log(req.body);
  try {
    let user = await UserModel.findById(_id);

    if (!user) {
      throw new Error('wrong id');
    } else {
      inDatabase = new ExerciseModel({
        _id,
        description,
        duration,
        date,
      });

      await inDatabase.save();

      console.log('inDatabase');
      console.log(inDatabase);
      res.json({
        username: user.username,
        description: inDatabase.description,
        duration: inDatabase.duration,
        _id: inDatabase._id,
        date: inDatabase.date,
      });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/api/users/:id/logs', async (req, res) => {
  let { _id, from, to, limit } = req.query;
  let inDatabase;

  try {
    inDatabase = await UserModel.findById(_id);

    if (!inDatabase) {
      throw new Error('wrong id');
    } else {
      inDatabase = await ExerciseModel.findById(_id)
        .where('date')
        .gte(from)
        .lte(to)
        .limit(limit);

      res.json({
        _id,
        log: inDatabase.map((item) => ({
          description: item.description,
          duration: item.duration,
          date: item.date,
        })),
      });
    }
  } catch (error) {
    res.json({ error: 'something went wrong' });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
