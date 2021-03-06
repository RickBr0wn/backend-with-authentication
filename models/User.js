const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 6,
    max: 15,
  },
  password: {
    type: String,
    required: true,
    min: 6,
    max: 15,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    required: true,
  },
  // sets type of 'todos' to accept the `_id` from the `TodoSchema`
  todos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }],
})

// hash the password before saving to database
UserSchema.pre('save', function (next) {
  console.log('🐛 - pre')
  // prevents hashing an already hashed password
  if (!this.isModified('password')) {
    console.log('🐛 - !this.isModified')
    return next()
  }
  // args: (password, salt, callback)
  bcrypt.hash(this.password, 10, (error, hashedPassword) => {
    console.log(`🐛 - hashedPassword: ${hashedPassword}`)
    if (error) {
      return next(error)
    }
    this.password = hashedPassword
    next()
  })
})

// compare the plain text version of the password (from the client)
// with the hashed password on the database
UserSchema.methods.comparePassword = function (password, callback) {
  // args: (password entered via the UI,
  //       hashed password attached to the userSchema in the database,
  //       callback)
  bcrypt.compare(password, this.password, (error, isMatch) => {
    if (error) {
      return callback(error)
    }
    if (!isMatch) {
      return callback(null, isMatch)
    }
    return callback(null, this)
  })
}

module.exports = mongoose.model('User', UserSchema)
