module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "mocha": true
    },
    "extends": "eslint:recommended",
    "overrides": [
        {
            "files": ["server.js", "api/**/*.js"],
            "env": {
                "node": true
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
    }
}
