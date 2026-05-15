export function validate(schema) {
  return (request, _response, next) => {
    const parsed = schema.parse({
      body: request.body,
      params: request.params,
      query: request.query,
    })

    request.validated = parsed
    next()
  }
}
