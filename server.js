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
    // default: ,
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
  const userId = req.params._id;
  let { limit } = req.query;
  var from = req.query.from
    ? new Date(req.query.from).getTime()
    : new Date('1111-11-11').getTime();
  var to = req.query.to
    ? new Date(req.query.to).getTime()
    : new Date().getTime();

  UserModel.findById(userId, (err, data) => {
    if (err) console.error(err);

    if (!data) {
      res.send('Unknown userId');
    } else {
      const username = data.username;
      console.log('*************************************');
      console.log('USER LOG SEARCHED: ' + username);
      console.log('from: ' + from, 'to: ' + to);

      ExerciseModel.find(
        { userId: userId } /*, {"date": {$gte: from, $lte: to}}*/
      )
        .select(['description', 'date', 'duration'])
        .limit(+limit)
        .sort({ date: -1 })
        .exec((err, data) => {
          if (err) console.error(err);
          let count = 0;
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
              _id: userId,
              username: username,
              count: 0,
              log: [],
            });
          } else {
            res.json({
              _id: userId,
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
//   const _id = req.params._id;
//   let { limit } = req.query;
//   let from = req.query.from
//     ? new Date(req.query.from).getTime()
//     : new Date().getTime();
//   let to = req.query.to
//     ? new Date(req.query.to).getTime()
//     : new Date().getTime();

//   try {
//     const user = await UserModel.findById(_id);

//     if (!user) {
//       res.send('wrong id');
//     } else {
//       const username = user.username;

//       let inDatabase = await ExerciseModel.find({ _id })
//         .select(['description', 'date', 'duration'])
//         .limit(+limit)
//         .sort({ date: -1 });

//       if (!inDatabase) {
//         throw new Error('no logs for this user');
//       }
//       let count = 0;
//       let filtered = inDatabase
//         .filter((element) => {
//           let newEle = new Date(element.date).getTime();
//           if (newEle >= from && newEle <= to) count++;
//           return newEle >= from && newEle <= to;
//         })
//         .map((element) => {
//           let newDate = new Date(element.date).toDateString();
//           return {
//             description: element.description,
//             duration: element.duration,
//             date: newDate,
//           };
//         });
//       // if (!inDatabase) {
//       //   res.json({
//       //     _id: _id,
//       //     username: username,
//       //     count: 0,
//       //     log: [],
//       //   });
//       // } else {
//       res.json({
//         _id: _id,
//         username: username,
//         count: count,
//         log: filtered,
//       });
//       // }
//     }
//   } catch (error) {
//     res.json({ error: error.message });
//   }
// });

// app.get('/api/users/:id/logs', async (req, res) => {
//   let { _id, from, to, limit } = req.query;
//   let inDatabase;

//   try {
//     inDatabase = await UserModel.findById(_id);

//     if (!inDatabase) {
//       throw new Error('wrong id');
//     } else {
//       inDatabase = await ExerciseModel.findById(_id)
//         .where('date')
//         .gte(from)
//         .lte(to)
//         .limit(limit);

//       res.json({
//         _id,
//         log: inDatabase.map((item) => ({
//           description: item.description,
//           duration: item.duration,
//           date: item.date,
//         })),
//       });
//     }
//   } catch (error) {
//     res.json({ error: 'something went wrong' });
//   }
// });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
