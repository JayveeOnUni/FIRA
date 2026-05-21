const { app } = require('./app')
const { env, validateProductionEnv } = require('./config/env')

validateProductionEnv()

app.listen(env.port, () => {
  // Keep startup log concise for local development.
  console.log(`FIRA API server running on http://localhost:${env.port}`)
})
