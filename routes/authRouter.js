const express = require('express')
const authRouter = express.Router()
const passport = require('passport')
const passportConfig = require('../passport')
const JWT = require('jsonwebtoken')
const User = require('../models/User')
const Todo = require('../models/Todo')

const signToken = userId =>
  JWT.sign(
    {
      iss: 'rick_brown',
      sub: userId,
    },
    'rick_brown',
    { expiresIn: '1h' }
  )

authRouter.post('/register', (req, res) => {
  const { username, password, role } = req.body
  User.findOne({ username }, (err, userDocument) => {
    if (err) {
      res.status(500).json({
        message: {
          msgBody:
            '🤖 - oops! an error has occurred whilst communicating with the database',
          msgError: true,
        },
      })
    }
    if (userDocument) {
      res.status(400).json({
        message: {
          msgBody: '🤖🚫 - username already taken',
          msgError: true,
        },
      })
    } else {
      const newUser = new User({ username, password, role })
      newUser.save(err => {
        if (err) {
          res.status(500).json({
            message: {
              msgBody:
                '🤖 - oops! an error has occurred whilst saving to the database',
              msgError: true,
            },
          })
        } else {
          res.status(200).json({
            message: {
              msgBody: '🤖👍🏻 - account successfully created',
              msgError: false,
            },
          })
        }
      })
    }
  })
})

authRouter.post(
  '/login',
  passport.authenticate('local', { session: false }),
  (req, res) => {
    if (req.isAuthenticated()) {
      const { _id, username, role } = req.user
      const token = signToken(_id)
      res.cookie('access_token', token, { httpOnly: true, sameSite: true })
      res.status(200).json({ isAuthenticated: true, user: { username, role } })
    }
  }
)

authRouter.get(
  '/logout',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.clearCookie('access_token')
    res.status(200).json({ user: { username: '', role: '' }, success: true })
  }
)

authRouter.post(
  '/todo',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const todo = new Todo(req.body)
    todo.save(err => {
      if (err) {
        res.status(500).json({
          message: {
            msgBody:
              '🤖 - an error has occurred whilst communicating with the todos.',
            msgError: true,
          },
        })
      }
      req.user.todos.push(todo)
      req.user.save(err => {
        // TODO: create error middleware for DRY approach
        if (err) {
          res.status(500).json({
            message: {
              msgBody: '🤖 - an error has occurred whilst saving the new todo.',
              msgError: true,
            },
          })
        }
        res.status(200).json({
          message: {
            msgBody: '🤖 - successfully created todo',
            msgError: false,
          },
        })
      })
    })
  }
)

authRouter.get(
  '/todos',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    User.findById({ _id: req.user._id })
      .populate('todos')
      .exec((err, doc) => {
        if (err) {
          res.status(500).json({
            message: {
              msgBody:
                '🤖- an error has occurred whilst populating the `user` todo array.',
              msgError: true,
            },
          })
        }
        res.status(200).json({ todos: doc.todos, authenticated: true })
      })
  }
)

authRouter.get(
  '/admin',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    if (req.user.role === 'admin') {
      res.status(200).json({
        message: { msgBody: '🤖👍🏻 - you are an admin', msgError: false },
      })
    } else {
      res.status(403).json({
        message: {
          msgBody: '🤖🚫 - you are not an admin, go away. ',
          msgError: true,
        },
      })
    }
  }
)

authRouter.get(
  '/authenticated',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { username, role } = req.user
    res.status(200).json({ isAuthenticated: true, user: { username, role } })
  }
)

module.exports = authRouter
