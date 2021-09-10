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

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
});

const UserModel = mongoose.model('User', UserSchema);

const ExerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    maxlength: [25, 'Description too long, not greater than 25'],
  },
  duration: {
    type: Number,
    required: true,
    min: [1, 'Duration too short, at least 1 minute'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  _id: {
    type: String,
    required: true,
  },
});

const ExerciseModel = mongoose.model('Exercise', ExerciseSchema);

///////////////models///////////////
// const UserSchema = new mongoose.Schema({
//   username: {
//     type: String,
//   },
// });

// const UserModel = mongoose.model('User', UserSchema);

// const ExerciseSchema = new mongoose.Schema({
//   _id: {
//     type: String,
//     required: true,
//   },
//   description: {
//     type: String,
//     required: true,
//   },
//   duration: {
//     type: Number,
//     required: true,
//   },
//   date: {
//     type: Date,
//     // default: ,
//   },
// });
// // 'December 25, 1995 13:30:00';
// const ExerciseModel = mongoose.model('Exercise', ExerciseSchema);

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/views/index.html');
// });

// app.get('/api/users', async (req, res) => {
//   try {
//     let inDatabase = await UserModel.find();

//     res.json([...inDatabase]);
//   } catch (error) {
//     res.json({ error: 'something went wrong' });
//   }
// });

// app.post('/api/users', async (req, res) => {
//   const { username } = req.body;
//   let inDatabase;

//   try {
//     inDatabase = await UserModel.findOne({ username });
//     if (inDatabase) {
//       throw new Error('user exists with username');
//     } else {
//       inDatabase = new UserModel({ username });
//       await inDatabase.save();

//       console.log('inDatabase');
//       console.log(inDatabase);

//       res.send({
//         username: inDatabase.username,
//         _id: inDatabase._id,
//       });
//     }
//   } catch (error) {
//     res.json({ error: 'something went wrong' });
//   }
// });

// app.post('/api/users/:id?/exercises', async (req, res) => {
//   let { _id, description, duration, date } = req.body;
//   let inDatabase;

//   console.log(req.body);
//   try {
//     let user = await UserModel.findById(_id);

//     if (!user) {
//       throw new Error('wrong id');
//     } else {
//       inDatabase = new ExerciseModel({
//         _id,
//         description,
//         duration,
//         date,
//       });

//       await inDatabase.save();

//       res.json({
//         username: user.username,
//         description,
//         duration,
//         _id: user._id,
//         date: moment().format('ddd MMMM DD YYYY'),
//         // ...user,
//         // description: inDatabase.description,
//         // duration: inDatabase.duration,
//         // date: new Date().toDateString(),
//       });
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

// const listener = app.listen(process.env.PORT || 3000, () => {
//   console.log('Your app is listening on port ' + listener.address().port);
// });

app.post('/api/users', (req, res, next) => {
  const { username } = req.body;
  UserModel.findOne({ username })
    .then((user) => {
      if (user) throw new Error('username already taken');
      return UserModel.create({ username });
    })
    .then((user) =>
      res.status(200).send({
        username: user.username,
        _id: user._id,
      })
    )
    .catch((err) => {
      console.log(err);
      res.status(500).send(err.message);
    });
});

app.post('/api/users/:id?/exercises', (req, res, next) => {
  let { _id, description, duration, date } = req.body;
  UserModel.findOne({ _id: _id })
    .then((user) => {
      if (!user) throw new Error('Unknown user with _id');
      date = date || Date.now();
      return ExerciseModel.create({
        description,
        duration,
        date,
        _id,
      }).then((ex) =>
        res.status(200).send({
          username: user.username,
          description,
          duration,
          _id,
          date: moment(ex.date).format('ddd MMMM DD YYYY'),
        })
      );
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err.message);
    });
});

app.get('/api/users/:id/logs', (req, res, next) => {
  let { _id, from, to, limit } = req.query;
  from = moment(from, 'YYYY-MM-DD').isValid() ? moment(from, 'YYYY-MM-DD') : 0;
  to = moment(to, 'YYYY-MM-DD').isValid()
    ? moment(to, 'YYYY-MM-DD')
    : moment().add(1000000000000);
  User.findById(_id)
    .then((user) => {
      if (!user) throw new Error('Unknown user with _id');
      Exercise.find({ _id })
        .where('date')
        .gte(from)
        .lte(to)
        .limit(+limit)
        .exec()
        .then((log) =>
          res.status(200).send({
            _id,
            username: user.username,
            count: log.length,
            log: log.map((o) => ({
              description: o.description,
              duration: o.duration,
              date: moment(o).format('ddd MMMM DD YYYY'),
            })),
          })
        );
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err.message);
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
