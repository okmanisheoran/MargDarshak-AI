export class UpstreamServiceError extends Error {
  constructor(message, options) {
    super(message, options)
    this.name = 'UpstreamServiceError'
  }
}
