import { create } from "zustand";

import {
    Country,
    State,
    City,
} from "../types/location";

interface LocationState {

    countries: Country[];

    states: State[];

    cities: City[];

    setCountries: (
        countries: Country[]
    ) => void;

    setStates: (
        states: State[]
    ) => void;

    setCities: (
        cities: City[]
    ) => void;
}

export const useLocationStore =
    create<LocationState>((set) => ({

        countries: [],

        states: [],

        cities: [],

        setCountries: (countries) =>
            set({ countries }),

        setStates: (states) =>
            set({ states }),

        setCities: (cities) =>
            set({ cities }),

    }));