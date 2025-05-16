import { createTheme } from "@mui/material";

const theme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#222'
        },
        primary: {
            main: '#a0e7e5'
        },
        secondary: {
            main: '#b4f8c8'
        },
        success: {
            main: '#b4f8c8'
        },
        warning: {
            main: '#fbe7c6'
        },
        error: {
            main: '#ffaebc'
        },
        grey: {
            main: '#7d7d7d'
        }
    }
})

export default theme;

//Yellow
// #fbe7c6

// Mint
// #b4f8c8

// Tiffany Blue
// #a0e7e5

// Hot Pink
// #ffaebc