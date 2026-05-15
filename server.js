import 'dotenv/config'
import { createApp } from './src/app.js'
import { env } from './src/config/env.js'

const app = createApp()

app.listen(env.port, () => {
  console.log(`Backend API running on http://localhost:${env.port}`)
})
