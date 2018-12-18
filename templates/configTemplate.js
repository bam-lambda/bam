module.exports = function configTemplate(accountNumber, roleName) {
  return {
    accountNumber,
    role: roleName,
  };
};
