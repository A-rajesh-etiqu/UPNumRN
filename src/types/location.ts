export interface Country {

    id: string;

    name: string;

}

export interface State {

    id: string;

    countryId: string;

    name: string;

}

export interface City {

    id: string;

    stateId: string;

    name: string;

}