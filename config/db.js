const mongoose = require('mongoose');

require('dotenv').config({path: 'variables.env'});

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.DB_MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
    console.log("DB CONECTADA!");
  } catch (error) {
    console.log("ERROR! ", error);
    process.exit(1);
  }
}

module.exports = conectarDB;