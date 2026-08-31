import { Platform } from "react-native";

const Shadows = {

    xs: Platform.select({

        ios: {

            shadowColor: "#000",

            shadowOffset: {
                width: 0,
                height: 1,
            },

            shadowOpacity: 0.05,

            shadowRadius: 2,

        },

        android: {

            elevation: 1,

        },

        web: {

            boxShadow: "0 1px 4px rgba(0,0,0,.05)",

        },

    }),

    sm: Platform.select({

        ios: {

            shadowColor: "#000",

            shadowOffset: {
                width: 0,
                height: 2,
            },

            shadowOpacity: 0.08,

            shadowRadius: 4,

        },

        android: {

            elevation: 2,

        },

        web: {

            boxShadow: "0 2px 8px rgba(0,0,0,.08)",

        },

    }),

    md: Platform.select({

        ios: {

            shadowColor: "#000",

            shadowOffset: {
                width: 0,
                height: 4,
            },

            shadowOpacity: 0.10,

            shadowRadius: 8,

        },

        android: {

            elevation: 4,

        },

        web: {

            boxShadow: "0 4px 12px rgba(0,0,0,.10)",

        },

    }),

    lg: Platform.select({

        ios: {

            shadowColor: "#000",

            shadowOffset: {
                width: 0,
                height: 8,
            },

            shadowOpacity: 0.15,

            shadowRadius: 16,

        },

        android: {

            elevation: 8,

        },

        web: {

            boxShadow: "0 10px 30px rgba(0,0,0,.15)",

        },

    }),

    button: Platform.select({

        ios: {

            shadowColor: "#6D28D9",

            shadowOffset: {
                width: 0,
                height: 4,
            },

            shadowOpacity: 0.25,

            shadowRadius: 8,

        },

        android: {

            elevation: 6,

        },

        web: {

            boxShadow: "0 8px 25px rgba(109,40,217,.30)",

        },

    }),

};

export default Shadows;