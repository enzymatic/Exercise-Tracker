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
  userId: {
    type: String,
    required: true,
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

app.post('/api/users/:userId?/exercises', async (req, res) => {
  let { userId, description, duration, date } = req.body;
  let inDatabase;

  try {
    inDatabase = await UserModel.findById(userId);

    if (!inDatabase) {
      throw new Error('wrong id');
    } else {
      inDatabase = new ExerciseModel({
        description,
        duration,
        date,
        userId,
      });

      await inDatabase.save();

      res.json({
        username: inDatabase.username,
        description: inDatabase.description,
        duration: inDatabase.duration,
        _id: inDatabase._id,
        date: inDatabase.date,
      });
    }
  } catch (error) {
    res.json({ error: 'something went wrong try again' });
  }
});

app.get('/api/users/:id/logs', async (req, res) => {
  let { userId, from, to, limit } = req.query;
  let inDatabase;

  try {
    inDatabase = await UserModel.findById(userId);

    if (!inDatabase) {
      throw new Error('wrong id');
    } else {
      inDatabase = await ExerciseModel.findById(userId)
        .where('date')
        .gte(from)
        .lte(to)
        .limit(limit);

      res.json({
        _id: userId,
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
