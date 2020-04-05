module.exports = {
    extends: [
        'react-app',
        'prettier/@typescript-eslint',
        'plugin:prettier/recommended',
    ],
    settings: {
        react: {
            version: '999.999.999',
        },
    },
    rules: {
        'no-control-regex': 0,
        'no-useless-concat': 0,
    },
}

