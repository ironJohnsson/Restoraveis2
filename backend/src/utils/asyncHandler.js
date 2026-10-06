/** Encaminha erros de handlers assíncronos do Express para o middleware de erros. */
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
