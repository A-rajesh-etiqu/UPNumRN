import {
    COUNTRIES,
    STATES,
    CITIES,
} from "../mocks/location.mock";

class LocationService {

    async getCountries() {

        return COUNTRIES;

    }

    async getStates(countryId: string) {

        return STATES.filter(
            (item) =>
                item.countryId === countryId
        );

    }

    async getCities(stateId: string) {

        return CITIES.filter(
            (item) =>
                item.stateId === stateId
        );

    }
}

export const locationService =
    new LocationService();