import { configureStore } from "@reduxjs/toolkit";
import KachraSlice from "../features/Kachra/KachraSlice";

export const Store = configureStore({
    reducer:KachraSlice,
});