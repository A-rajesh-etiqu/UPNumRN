import {
    Country,
    State,
    City,
} from "../types/location";

export const COUNTRIES: Country[] = [
    {
        id: "IN",
        name: "India",
    },
];

export const STATES: State[] = [
    {
        id: "TN",
        countryId: "IN",
        name: "Tamil Nadu",
    },
    {
        id: "KA",
        countryId: "IN",
        name: "Karnataka",
    },
];

export const CITIES: City[] = [
    {
        id: "CHE",
        stateId: "TN",
        name: "Chennai",
    },
    {
        id: "CBE",
        stateId: "TN",
        name: "Coimbatore",
    },
    {
        id: "BLR",
        stateId: "KA",
        name: "Bengaluru",
    },
    {
        id: "MYS",
        stateId: "KA",
        name: "Mysuru",
    },
];