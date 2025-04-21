import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage
import { combineReducers } from 'redux';
import authReducer from './authSlice';
import employeeReducer from './employeeSlice';
// import attendanceReducer from './attendanceSlice'; // Assuming you have this
import leaveReducer from '../features/leave/slices/leaveSlice'; // <-- Import leave slice

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'employee'], // only persist auth and employee slices
};

const rootReducer = combineReducers({
  auth: authReducer,
  employee: employeeReducer,
  // attendance: attendanceReducer, // Assuming you have this
  leave: leaveReducer, // <-- Add leave reducer
  // other reducers
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);
