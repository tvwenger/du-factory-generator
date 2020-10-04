const { preserve, ignore } = require("./build-util")
const config = require("./webpack.config")

module.exports = config({
    ifProd: preserve,
    ifDev: ignore,
})