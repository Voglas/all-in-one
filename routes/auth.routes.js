const {Router} = require ('express')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const {check, validationResult} = require('express-validator')
const User = require('../models/User')
const router = Router()

// /api/auth/register
router.post('/register',
    [
        check('email',  'Incorrect email').isEmail(),
        check('password', 'Minimal length of password is 6 simbols').isLength({min:6})
    ],
    async (req, res) =>{
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'Incorrect registration data'
            })
        }

        const {email, password} = req.body

        const candidate = await User.findOne({ email })

        if (candidate) {
            return res.status(400).json ({ message: 'The username is already used'})
        }

        const hashedPassword = await bcrypt.hash(password, 12)
        const user = new User ({ email, password: hashedPassword})

        await user.save()

        res.status(201).json({ message: 'New user is created successfully'})

    } catch (e) {
        res.status(500).json({ message: 'Smth is going wrong. Try again'})
    }
})

// /api/auth/login
router.post(
    '/login',
    [
      check('email', 'Enter correct mail').normalizeEmail().isEmail(),
      check('password', 'Enter your password').exists()
    ],
    async (req, res) =>{
        try {
            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Incorrect login data'
                })
            }

            const {email, password} = req.body

            const user = await User.findOne({ email })

            if (!user) {
                return res.status(400).json({ message: 'User not found' })
            }

            const isMatch = await bcrypt.compare(password, user.password)

            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect password. Try again'})
            }

            const token = jwt.sign(
                { userId: user.id },
                config.get('jwtSecret'),
                { expiresIn: '12h' }
            )

            res.json({ token, userId: user.id })

        } catch (e) {
            res.status(500).json({ message: 'Smth is going wrong. Try again'})
        }
    })

module.exports = router