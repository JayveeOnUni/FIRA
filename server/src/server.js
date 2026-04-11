const { app } = require('./app')
const { env } = require('./config/env')

app.listen(env.port, () => {
  // Keep startup log concise for local development.
  console.log(`FIRA API server running on http://localhost:${env.port}`)
})
