import { useEffect } from "react";

import { locationService }
    from "../services/location.service";

import { useLocationStore }
    from "../store/location.store";

export function useLocation() {

    const {

        countries,

        states,

        cities,

        setCountries,

        setStates,

        setCities,

    } = useLocationStore();

    useEffect(() => {

        loadCountries();

    }, []);

    async function loadCountries() {

        const data =
            await locationService
                .getCountries();

        setCountries(data);

    }

    async function loadStates(
        countryId: string
    ) {

        const data =
            await locationService
                .getStates(countryId);

        setStates(data);

    }

    async function loadCities(
        stateId: string
    ) {

        const data =
            await locationService
                .getCities(stateId);

        setCities(data);

    }

    return {

        countries,

        states,

        cities,

        loadStates,

        loadCities,

    };
}