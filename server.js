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

const { Schema } = mongoose;
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  log: [
    {
      description: {
        type: String,
      },
      duration: {
        type: Number,
      },
      date: {
        type: Date,
      },
    },
  ],
});
// define the model, on which all documents will be based
const User = mongoose.model('User', userSchema);

// EXPRESS && ROUTING
// in the root path render the HTML file as found in the views folder
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/views/index.html`);
});

// in the path selected to register a user, retrieve the value of the username
// register the user if a user is not registered with the same name
app.post('/api/users', (req, res) => {
  const { username: reqUsername } = req.body;

  // search for a document matching the username
  User.findOne(
    {
      username: reqUsername,
    },
    (errFound, userFound) => {
      if (errFound) {
        console.log('findOne() error');
      }
      // findOne() returns either **null** or a **document** matching the search
      if (userFound) {
        // if a document is found, return a message detailing how the name is not available
        res.send('username already taken');
      } else {
        // else create a document for the input username
        // detail log as an empty array
        const user = new User({
          username: reqUsername,
          log: [],
        });
        // save the object in the database
        user.save((errSaved, userSaved) => {
          if (errSaved) {
            console.log('save() error');
          }
          // display a JSON object detailing the _id and the username
          const { _id, username } = userSaved;
          res.json({
            username,
            _id,
          });
        });
      }
    }
  );
});

// in the path selected to register an exercise, find and update the document matching the id
app.post('/api/users/:id?/exercises', (req, res) => {
  // retrieve the values from the form
  const {
    _id,
    description,
    duration,
    dateYear = 2014,
    dateMonth = 04,
    dateDay = 01,
  } = req.body;

  console.log(req.body);
  // create an instance of the date object, based on the year, month and day value
  const date = new Date(`${dateYear}-${dateMonth}-${dateDay}`);

  // create a log out of the description, duration and date fields
  const log = {
    description,
    duration,
    date,
  };

  // look for a document with a matching _id value
  User.findOneAndUpdate(
    {
      _id,
    },
    {
      // push in the log array the new object detailing the exercise
      $push: {
        log,
      },
    },
    {
      // in the options set new to be true, as to have the function return the updated document
      new: true,
    },
    (errFound, userFound) => {
      if (errFound) {
        console.log('findOne() error');
      }
      // findOneAndUpdate returns **null** or a matching **document** depending on whether a match is found
      if (userFound) {
        //  a match is found, return a JSON object detailing the username and latest exercise
        const { username } = userFound;

        console.log(username);
        res.json({
          _id,
          username,
          description,
          duration,
          date: date.toDateString(),
        });
      } else {
        // findOne returns null, detail how the ID does not match an existinfg document
        res.send('unknown _id');
      }
    }
  );
});

// in the path selected to log the excercises, return the data attached to the userId
// if existing, otherwise return a JSON object detailing the occurrence
app.get('/api/users/:id/logs', (req, res) => {
  const { userId: _id, from, to } = req.query;

  // look in the database for a document matching the userId
  User.findOne(
    {
      _id,
    },
    (errFound, userFound) => {
      if (errFound) {
        console.log('findOne() error');
      }

      if (userFound) {
        // if a user is found, return a JSON object detailing the relevant data
        const { username, log } = userFound;

        // create a copy of the log array, to be modified as to show the relevant exercises in the right order
        let responseLog = [...log];

        // if **from** and or **to** are specified in the query string
        // filter the array considering only the exercises past and or prior to the input values
        if (from) {
          const dateFrom = new Date(from);
          responseLog = responseLog.filter(
            (exercise) => exercise.date > dateFrom
          );
        }
        if (to) {
          const dateTo = new Date(to);
          responseLog = responseLog.filter(
            (exercise) => exercise.date < dateTo
          );
        }

        // update the array sorting the exercises from oldest to newest
        responseLog = responseLog
          .sort(
            (firstExercise, secondExercise) =>
              firstExercise.date > secondExercise.date
          )
          .map((exercise) => ({
            // detail the fields of the output formatting the date into the desired format
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString(),
          }));

        // retrieve the length of the updated array
        const { length: count } = responseLog;

        // return a json object with the pertinent information
        res.json({
          _id,
          username,
          count,
          log: responseLog,
        });
      } else {
        // findOne() returns null, detail how the userId does not match an existinfg document
        res.send('unknown userId');
      }
    }
  );
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
