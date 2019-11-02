module.exports = {
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.,
  ],
  env: {
    jest: true,
    node: true,
  },
  rules: {
    'consistent-return': 0,
    'no-await-in-loop': 0,
  },
};
