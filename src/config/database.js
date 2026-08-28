mongoose.connect(env.mongodbUri, {
  serverSelectionTimeoutMS: env.mongodbConnectionTimeoutMs,
  connectTimeoutMS: env.mongodbConnectionTimeoutMs,
  heartbeatFrequencyMS: 10_000,
  family: 4,
  maxPoolSize: 10,
})