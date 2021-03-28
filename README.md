# Dual Universe Factory Generator

Use the application here: https://lgfrbcsgo.github.io/du-factory-generator/latest/

This is an application for generating a factory plan for [Dual
Universe](https://www.dualuniverse.game/). Given a set of items, the
number of assemblers producing each item, and the quantity to maintain
in the output containers, this tool will generate a full production
line from ores to the requested items. The designed factory plan will
ensure that all production rates are satisfied, so that the factory
will run at full capacity. Each item type is stored in an individual
container so that factory monitor scripts can monitor their contents.
Here is an example factory plan, where we produce each type of fuel:

![Example Factory Plan](./src/assets/example-map.svg)

[Load the
application](https://lgfrbcsgo.github.io/du-factory-generator/latest/) and
click "Help Information" for information about using this tool.

Previous versions of the tool [can be found here](https://lgfrbcsgo.github.io/du-factory-generator/).

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
`Nikolaus`.

## Contributors

-   [lgfrbcsgo](https://github.com/lgfrbcsgo)
-   [tvwenger](https://github.com/tvwenger) AKA Nikolaus
-   [ShadowLordAlpha](https://github.com/ShadowLordAlpha)
-   "The Prospectors" for compiling item information

## License

Dual Universe Factory Generator is licensed under the MIT License.
See [LICENSE](./LICENSE)
