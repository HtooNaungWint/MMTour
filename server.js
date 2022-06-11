const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

const app = require('./app');

const port = process.env.PORT || 3000;

//console.log(process.env);
//console.log(process.env.NODE_ENV);
console.log(process.env.DATABASE_URL);
const server = app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('unhandledRejection .........🥶');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

//db connection
// TODO: use uri form config.json DB name = tour_db
const uri = process.env.DATABASE_URL.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
// const uri =
//   //'mongodb+srv://root:rootroot@cluster0.2fstg.mongodb.net/tour_db?retryWrites=true&w=majority';
//   `mongodb://localhost:27017/tour_db`;

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindandModify: false,
  })
  // eslint-disable-next-line no-unused-vars
  .then((con) => {
    console.log('connection established');
  });
// .then((con) => {
//   console.log('connection established');
//   console.log(con.connections);
// });
