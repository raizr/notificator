const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
  },
  firstName: {
    type: String,
    minlength: 1,
    maxlength: 300,
  },
});

const PlayerSchema = mongoose.model('players', playerSchema);

module.exports = {
  mongoose,
  PlayerSchema,
};
