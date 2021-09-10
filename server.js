const express = require('express');
const app = express();
const mongoose = require('mongoose');
const moment = require('moment');
const cors = require('cors');
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true });

///////////////models///////////////
// const UserSchema = new mongoose.Schema({
//   username: {
//     type: String,
//   },
// });

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  log: [],
});

const UserModel = mongoose.model('User', UserSchema);

const ExerciseSchema = new mongoose.Schema({
  // _id: {
  //   type: String,
  //   required: true,
  // },
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

app.get('/api/users/:_id/logs', async (req, res) => {
  let { limit } = req.query;
  let { _id } = req.params;

  let from = req.query.from
    ? new Date(req.query.from).getTime()
    : new Date('1970-01-01').getTime();
  let to = req.query.to
    ? new Date(req.query.to).getTime()
    : new Date().getTime();

  try {
    let user = await UserModel.findById(_id);

    if (!user) {
      throw new Error('wrong id, try again');
    } else {
      res.json({
        username: user.username,
        count: user.log.length,
        _id: user._id,
        log: [
          ...user.log
            .filter((exercise) => {
              let newEle = new Date(exercise.date).getTime();
              return newEle >= from && newEle <= to;
            })
            .slice(0, limit)
            .map(({ description, duration, date: oldDate }) => {
              let date = new Date(oldDate).toDateString();
              return {
                description,
                duration,
                date,
              };
            }),
        ],
      });
    }
  } catch (error) {
    res.json({ error: 'something went wrong' });
  }
});

app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  let inDatabase;

  console.log('am in the post');

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

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { duration, description } = req.body;
  let date = req.body.date ? new Date(req.body.date) : new Date();

  console.log(_id);

  let log = {
    duration,
    description,
    date: date.toDateString(),
  };

  try {
    const user = await UserModel.findById(_id);

    console.log(user);

    if (!user) {
      res.send('Wrong id');
    } else {
      const username = user.username;
      let updatedUser = new UserModel(Object.assign(user, user.log.push(log)));

      await updatedUser.save();

      res.json({
        _id,
        username,
        ...log,
      });
      // res.json({
      //   _id,
      //   username,
      //   date: date.toDateString(),
      //   duration: parseInt(duration),
      //   description,
      // });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});
// app.post('/api/users/:_id/exercises', async (req, res) => {
//   const _id = req.params._id;
//   const { duration, description } = req.body;
//   let date = req.body.date ? new Date(req.body.date) : new Date();

//   try {
//     const user = await UserModel.findById(_id);
//     if (!user) {
//       res.send('Wrong id');
//     } else {
//       const username = user.username;
//       await ExerciseModel.create({
//         date: date.toDateString(),
//         duration,
//         description,
//       });
//       res.json({
//         _id,
//         username,
//         date: date.toDateString(),
//         duration: parseInt(duration),
//         description,
//       });
//     }
//   } catch (error) {
//     res.json({ error: error.message });
//   }
// });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
