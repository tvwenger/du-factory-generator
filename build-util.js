function preserve(value) {
    return value
}

function ignore(value) {
    if (Array.isArray(value)) {
        return []
    } else {
        return {}
    }
}

module.exports = {
    preserve,
    ignore,
}