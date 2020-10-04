export function simulate_annealing<T>(
    initialState: T,
    mutateState: (state: T) => T,
    computeEnergy: (state: T) => number,
    tempMax: number,
    tempMin: number,
    coolTemp: (temp: number) => number,
): T {
    let currentTemp = tempMax

    let currentState = initialState
    let currentEnergy = computeEnergy(currentState)

    let bestState = currentState
    let bestEnergy = currentEnergy

    for (let temp = tempMax; temp > tempMin; temp = coolTemp(temp)) {
        let nextState = mutateState(currentState)
        let nextEnergy = computeEnergy(nextState)

        if (
            nextEnergy < currentEnergy ||
            Math.exp((currentEnergy - nextEnergy) / currentTemp) > Math.random()
        ) {
            currentState = nextState
            currentEnergy = nextEnergy

            if (nextEnergy < bestEnergy) {
                bestState = nextState
                bestEnergy = nextEnergy
            }
        }
    }

    return bestState
}