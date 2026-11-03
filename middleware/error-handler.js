function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "ECONNREFUSED" && err.port === 5432) {
    console.log(
      "The database connection was refused. Is your database service running?",
    );
  }

  return res.status(500).json({
    message: "Internal server error.",
  });
}

module.exports = errorHandler;
