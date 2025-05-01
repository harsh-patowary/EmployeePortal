// import api from '../../../utils/api'; // Keep for later backend integration
import { mockNotices, addMockNotice } from '../mock/mockData';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Mock API Functions ---

export const fetchNoticesAPI = async () => {
    console.log("Mock Service: Fetching Notices...");
    await delay(500); // Simulate network latency
    // In real API, filter based on user role/team/department on backend
    // For mock, return all for now
    return [...mockNotices].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const fetchNoticeDetailsAPI = async (noticeId) => {
    console.log(`Mock Service: Fetching Details for Notice ${noticeId}...`);
    await delay(300);
    const notice = mockNotices.find(n => n.id === noticeId);
    if (!notice) {
        throw new Error(`Notice with ID ${noticeId} not found.`);
    }
    return { ...notice }; // Return a copy
};

export const createNoticeAPI = async (noticeData) => {
    console.log("Mock Service: Creating Notice...", noticeData);
    await delay(600);
    // Basic validation simulation
    if (!noticeData.title || !noticeData.content || !noticeData.scope) {
        throw new Error("Missing required fields (title, content, scope).");
    }
    // Simulate backend assigning ID, timestamp, author
    const newNotice = addMockNotice(noticeData);
    return newNotice;
};

// --- Add update/delete functions later ---
// export const updateNoticeAPI = async (noticeId, updateData) => { ... };
// export const deleteNoticeAPI = async (noticeId) => { ... };


// --- Real API Functions (Example Structure for later) ---
/*
export const fetchNoticesAPI = async () => {
    try {
        const response = await api.get('/notices/'); // Adjust endpoint
        return response.data;
    } catch (error) {
        console.error("Error fetching notices:", error.response?.data || error.message);
        throw error;
    }
};

export const fetchNoticeDetailsAPI = async (noticeId) => {
     try {
        const response = await api.get(`/notices/${noticeId}/`); // Adjust endpoint
        return response.data;
    } catch (error) {
        console.error(`Error fetching notice ${noticeId}:`, error.response?.data || error.message);
        throw error;
    }
};

export const createNoticeAPI = async (noticeData) => {
     try {
        const response = await api.post('/notices/', noticeData); // Adjust endpoint
        return response.data;
    } catch (error) {
        console.error("Error creating notice:", error.response?.data || error.message);
        throw error; // Let the thunk handle rejection
    }
};
*/