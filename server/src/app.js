const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const apiRoutes = require('./routes')
const { env } = require('./config/env')
const { attachRequestContext } = require('./middleware/requestContext')
const { notFound } = require('./middleware/notFound')
const { errorHandler } = require('./middleware/errorHandler')

const app = express()

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(attachRequestContext)

if (env.nodeEnv !== 'test') {
  morgan.token('request-id', (req) => req.requestId || '-')
  app.use(morgan(':method :url :status :response-time ms req_id=:request-id'))
}

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'FIRA API',
    phase: 'phase-7-responsible-ai-and-operations-enhancement',
    docs: '/api/health',
  })
})

app.use('/api', apiRoutes)
app.use(notFound)
app.use(errorHandler)

module.exports = { app }
