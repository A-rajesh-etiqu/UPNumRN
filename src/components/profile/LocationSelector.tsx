import React, { useEffect, useState } from "react";
import { View } from "react-native";

import CountrySelector from "./CountrySelector";
import StateSelector from "./StateSelector";
import CitySelector from "./CitySelector";

interface Props {
    country: string;
    state: string;
    city: string;

    onCountryChange: (country: string) => void;
    onStateChange: (state: string) => void;
    onCityChange: (city: string) => void;
}

export default function LocationSelector({
    country,
    state,
    city,
    onCountryChange,
    onStateChange,
    onCityChange,
}: Props) {

    const [selectedCountry, setSelectedCountry] =
        useState(country);

    const [selectedState, setSelectedState] =
        useState(state);

    const [selectedCity, setSelectedCity] =
        useState(city);

    useEffect(() => {

        setSelectedCountry(country);

    }, [country]);

    useEffect(() => {

        setSelectedState(state);

    }, [state]);

    useEffect(() => {

        setSelectedCity(city);

    }, [city]);

    function handleCountryChange(value: string) {

        setSelectedCountry(value);

        setSelectedState("");

        setSelectedCity("");

        onCountryChange(value);

        onStateChange("");

        onCityChange("");

    }

    function handleStateChange(value: string) {

        setSelectedState(value);

        setSelectedCity("");

        onStateChange(value);

        onCityChange("");

    }

    function handleCityChange(value: string) {

        setSelectedCity(value);

        onCityChange(value);

    }

    return (

        <View>

            <CountrySelector
                value={selectedCountry}
                onChange={handleCountryChange}
            />

            <StateSelector
                countryId={selectedCountry}
                value={selectedState}
                onChange={handleStateChange}
            />

            <CitySelector
                stateId={selectedState}
                value={selectedCity}
                onChange={handleCityChange}
            />

        </View>

    );
}