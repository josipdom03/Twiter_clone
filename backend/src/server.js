import express from 'express';
import sequelize from './config/database.js';
import './models/index.js'; 

const app = express();
const PORT = process.env.PORT || 5000;


sequelize.sync({ alter: true })
  .then(() => {
    console.log(' Tablice su sinkronizirane.');
    app.listen(PORT, () => {
      console.log(`Server radi na portu ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Greška pri sinkronizaciji baze:', err);
  });