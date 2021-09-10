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
  username: {
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

app.post('/api/users/:_id/exercises', async (req, res) => {
  const _id = req.params._id;
  const { duration, description } = req.body;
  let date = req.body.date ? new Date(req.body.date) : new Date();

  try {
    const user = await UserModel.findById(_id);
    if (!user) {
      res.send('Wrong id');
    } else {
      const username = user.username;
      await ExerciseModel.create({
        _id,
        username,
        date: date.toDateString(),
        duration,
        description,
      });
      res.json({
        _id,
        username,
        date: date.toDateString(),
        duration: parseInt(duration),
        description,
      });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/api/users/:_id/logs', (req, res) => {
  let _id = req.params._id;
  let { limit } = req.query;
  let from = req.query.from
    ? new Date(req.query.from).getTime()
    : new Date('1111-11-11').getTime();
  let to = req.query.to
    ? new Date(req.query.to).getTime()
    : new Date().getTime();

  UserModel.findById(_id, (err, data) => {
    if (err) console.error(err);

    if (!data) {
      res.send('Unknown userId');
    } else {
      const username = data.username;
      console.log('*************************************');
      console.log('USER LOG SEARCHED: ' + username);
      console.log('from: ' + from, 'to: ' + to);

      ExerciseModel.find({ _id })
        .select(['description', 'date', 'duration'])
        .where('date')
        .gte(from)
        .lte(to)
        .limit(limit)
        .exec((err, data) => {
          if (err) console.error(err);
          let count = 0;

          console.log('data', data);
          let customData = data
            .filter((element) => {
              let newEle = new Date(element.date).getTime();
              if (newEle >= from && newEle <= to) count++;
              return newEle >= from && newEle <= to;
            })
            .map((element) => {
              let newDate = new Date(element.date).toDateString();
              return {
                description: element.description,
                duration: element.duration,
                date: newDate,
              };
            });
          if (!data) {
            res.json({
              _id,
              username: username,
              count: 0,
              log: [],
            });
          } else {
            res.json({
              _id,
              username: username,
              count: count,
              log: customData,
            });
          }
        });
    }
  });
});

// app.get('/api/users/:_id/logs', async (req, res) => {
//   let { limit = -1 } = req.query;
//   let { _id } = req.params;

//   let from = req.query.from
//     ? new Date(req.query.from).getTime()
//     : new Date('1-1-1').getTime();
//   let to = req.query.to
//     ? new Date(req.query.to).getTime()
//     : new Date().getTime();

//   try {
//     let user = await UserModel.findById(_id);

//     if (!user) {
//       throw new Error('wrong id, try again');
//     } else {
//       let exercises = await ExerciseModel.find({ _id })
//         .where('date')
//         .gte(from)
//         .lte(to)
//         .limit(limit);

//       if (!exercises) {
//         res.json({
//           username: user.username,
//           count: 0,
//           _id: user._id,
//           log: [],
//         });
//       } else {
//         res.json({
//           username: user.username,
//           count: exercises.length,
//           _id: user._id,
//           log: [
//             ...exercises.map(({ description, duration, date: oldDate }) => {
//               let date = new Date(oldDate).toDateString();
//               return {
//                 description,
//                 duration,
//                 date,
//               };
//             }),
//           ],
//         });
//       }
//     }
//   } catch (error) {
//     res.json({ error: 'something went wrong' });
//   }
// });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
