class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

function appError(status, message) {
  return new AppError(status, message);
}

module.exports = {
  AppError,
  appError
};
