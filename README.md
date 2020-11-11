# Dual Universe Factory Generator

Use the application here: https://lgfrbcsgo.github.io/du-factory-generator/

This is an application for generating a factory plan for [Dual
Universe](https://www.dualuniverse.game/). Given a set of items, the
number of assemblers producing each item, and the quantity to maintain
in the output containers, this tool will generate a full production
line from ores to the requested items. The designed factory plan will
ensure that all production rates are satisfied, so that the factory
will run at full capacity. Each item type is stored in an individual
container so that factory monitor scripts can monitor their contents.
Here is an example factory plan, where one assembler was requested for
Container L, Nitron Fuel, and Polycarbonate Plastic:

![Example Factory Plan](./src/assets/example-map.svg)
<img src="./src/assets/example-map.svg">

[Load the
application](https://lgfrbcsgo.github.io/du-factory-generator/) and
click "Help Information" for information about using this tool.

## Frequently Asked Questions

TBD

## Installation

### Prerequisites

[NodeJS](https://nodejs.org/en/)

### Install Dependencies and Build
```bash
$ npm install
$ npm run build
```

### Launch Development Server
```bash
$ npm start
```
Navigate your browser to http://localhost:8080/

## Bugs & Feature Requests

Please submit an
[issue](https://github.com/lgfrbcsgo/du-factory-generator/issues) to
report bugs or request new features.

## Contributing

DU Factory Generator is an open source project, and we welcome user
contributions to improve and expand its functionality! Feel free to
submit a pull request for anything from small fixes to big enhancements.

This project uses [Prettier](https://prettier.io/) for code formatting
and [TSLint](https://palantir.github.io/tslint/) for enforcing code
styles.

## Contact

Join our [Discord server](https://discord.gg/gXSWKqVnHx) and look for
lgfrbcsgo and Nikolaus Ephranor.

## Contributors

* [lgfrbcsgo](https://github.com/lgfrbcsgo)
* [tvwenger](https://github.com/tvwenger)

## License

Dual Universe Factory Generator is licensed under the MIT License.
See [LICENSE](./LICENSE)
