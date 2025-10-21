import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage
import { combineReducers } from 'redux';
import authReducer from './authSlice';
import employeeReducer from './employeeSlice';
// import attendanceReducer from './attendanceSlice'; // Assuming you have this
import leaveReducer from '../features/leave/slices/leaveSlice';
import noticeReducer from '../features/notice/slices/noticeSlice'; // <-- 1. Import the notice reducer

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'employee'], // <-- 3. Keep 'notice' out of the whitelist
};

const rootReducer = combineReducers({
  auth: authReducer,
  employee: employeeReducer,
  // attendance: attendanceReducer, // Assuming you have this
  leave: leaveReducer,
  notice: noticeReducer, // <-- 2. Add the notice reducer here
  // other reducers
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions and notice thunk actions
        ignoredActions: [
            'persist/PERSIST',
            'persist/REHYDRATE',
            'notice/fetchNotices/pending',
            'notice/fetchNotices/fulfilled',
            'notice/fetchNotices/rejected',
            'notice/fetchNoticeDetails/pending',
            'notice/fetchNoticeDetails/fulfilled',
            'notice/fetchNoticeDetails/rejected',
            'notice/createNotice/pending',
            'notice/createNotice/fulfilled',
            'notice/createNotice/rejected'
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);
