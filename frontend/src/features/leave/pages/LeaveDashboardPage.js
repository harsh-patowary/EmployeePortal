// filepath: d:\developement\employee_management\frontend\src\features\leave\pages\LeaveDashboardPage.js
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  fetchMyLeaveRequests,
  fetchPendingApprovals,
  selectMyLeaveRequests,
  selectPendingApprovalRequests,
  selectLeaveLoading,
  selectLeaveError,
  resetLeaveActionStatus,
  selectLeaveActionLoading,
  selectLeaveActionError,
} from "../slices/leaveSlice";
import {
  selectUser,
  selectIsManager,
  selectRole,
  selectPaidLeaveBalance,
  selectSickLeaveBalance,
  fetchUserDetails
} from "../../../redux/employeeSlice"; // Adjust path as needed
import LeaveBalanceDisplay from "../components/LeaveBalanceDisplay";
import LeaveRequestList from "../components/LeaveRequestList";
import LeaveRequestForm from "../components/LeaveRequestForm";
import LeaveDetailDialog from "../components/LeaveRequestDetailDialog";
import LeaveApprovalDialog from "../components/ApprovalActionDialog";
import SnackbarAlert from "../../../components/SnackbarAlert"; // Assuming you have a Snackbar component

function LeaveDashboardPage() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Selectors
  const currentUser = useSelector(selectUser);
  const isManager = useSelector(selectIsManager);
  const userRole = useSelector(selectRole);
  const myRequests = useSelector(selectMyLeaveRequests);
  const pendingApprovals = useSelector(selectPendingApprovalRequests);
  const loading = useSelector(selectLeaveLoading);
  const error = useSelector(selectLeaveError);
  const actionLoading = useSelector(selectLeaveActionLoading);
  const actionError = useSelector(selectLeaveActionError);
  const paidBalance = useSelector(selectPaidLeaveBalance);
  const sickBalance = useSelector(selectSickLeaveBalance);

  // State
  const [openRequestForm, setOpenRequestForm] = useState(false);
  const [openApprovalDialog, setOpenApprovalDialog] = useState(false);
  const [selectedRequestForAction, setSelectedRequestForAction] =
    useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false); // State for detail dialog
  const [selectedRequestForDetail, setSelectedRequestForDetail] =
    useState(null); // State for detail request
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [activeTab, setActiveTab] = useState(0); // 0: My Requests, 1: Approvals
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial load state

  // Check if user has approval roles
  const canApproveManager = isManager; // Simple check, adjust if needed
  const canApproveHr = ["hr", "admin", "director"].includes(userRole);
  const showApprovalTab = canApproveManager || canApproveHr;

  useEffect(() => {
    dispatch(resetLeaveActionStatus)
  }, [dispatch]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    // Initial data load
    const loadData = async () => {
      // Fetch my requests first
      await dispatch(fetchMyLeaveRequests());
      
      // Then fetch pending approvals if needed
      if (showApprovalTab) {
        await dispatch(fetchPendingApprovals());
      }
      
      // Mark initial load complete
      setIsInitialLoad(false);
    };
    
    loadData();
  }, [dispatch, showApprovalTab]);

  // Effect for tab changes - refresh data when tab changes
  useEffect(() => {
    // Skip during initial load to prevent duplicate fetches
    if (!isInitialLoad) {
      if (activeTab === 0) {
        dispatch(fetchMyLeaveRequests());
      } else if (activeTab === 1 && showApprovalTab) {
        dispatch(fetchPendingApprovals());
      }
    }
  }, [activeTab, dispatch, showApprovalTab, isInitialLoad]);

  // Reset action status when component mounts or action completes
  useEffect(() => {
    if (actionLoading === "succeeded" || actionLoading === "failed") {
      // Optionally show snackbar on success/failure
      if (actionLoading === "succeeded") {
        setSnackbar({
          open: true,
          message: "Action completed successfully!",
          severity: "success",
        });
        
        // Re-fetch data after successful action to update lists
        if (activeTab === 0) {
          dispatch(fetchMyLeaveRequests());
        } else if (showApprovalTab) {
          dispatch(fetchPendingApprovals());
        }
        
        // Add this line to refresh user details including leave balances
        dispatch(fetchUserDetails());
      } else if (actionError) {
        // Extract specific error message if available
        let errorMessage = "An error occurred."; // Default message

        if (typeof actionError === "string") {
          errorMessage = actionError;
        } else if (typeof actionError === 'object' && actionError !== null) {
            // Handle DRF ValidationError (often arrays or dicts)
            if (Array.isArray(actionError) && actionError.length > 0 && typeof actionError[0] === 'string') {
                errorMessage = actionError[0]; // Get first string error from array
            } else if (actionError.detail) {
                errorMessage = actionError.detail; // Standard DRF error
            } else if (actionError.reason) {
                errorMessage = actionError.reason; // Custom reason field?
            } else if (actionError.non_field_errors && Array.isArray(actionError.non_field_errors) && actionError.non_field_errors.length > 0) {
                errorMessage = actionError.non_field_errors[0]; // Common for non-field specific errors
            } else {
                // Try to find the first error message in a dictionary of field errors
                const firstFieldErrorKey = Object.keys(actionError)[0];
                if (firstFieldErrorKey && Array.isArray(actionError[firstFieldErrorKey]) && actionError[firstFieldErrorKey].length > 0) {
                    errorMessage = actionError[firstFieldErrorKey][0];
                } else {
                    // Fallback if structure is unexpected
                    try {
                        errorMessage = JSON.stringify(actionError);
                    } catch (e) { /* ignore stringify error */ }
                }
            }
        }

        setSnackbar({
          open: true,
          message: `Action failed: ${errorMessage}`, // Use the extracted message
          severity: "error",
        });
      }
      
      // Reset status after a delay to allow snackbar to show
      const timer = setTimeout(() => {
        dispatch(resetLeaveActionStatus());
      }, 3000); // Adjust delay as needed
      
      return () => clearTimeout(timer);
    }
  }, [actionLoading, actionError, dispatch, showApprovalTab, activeTab]);

  const handleOpenRequestForm = () => {
    dispatch(resetLeaveActionStatus()); // Reset action status before opening form
    setOpenRequestForm(true);
  };
  
  const handleCloseRequestForm = () => {
    setOpenRequestForm(false);
    // Reset action state when closing the form
    dispatch(resetLeaveActionStatus());
    // Optional: refetch data after closing form in case changes were made
    dispatch(fetchMyLeaveRequests());
  };

  const handleOpenApprovalDialog = (request) => {
    dispatch(resetLeaveActionStatus()); // Reset action status before opening dialog
    setSelectedRequestForAction(request);
    setOpenApprovalDialog(true);
  };
  
  const handleCloseApprovalDialog = () => {
    setSelectedRequestForAction(null);
    setOpenApprovalDialog(false);
    
    // Refetch appropriate data after closing dialog
    if (activeTab === 0) {
      dispatch(fetchMyLeaveRequests());
    } else if (activeTab === 1 && showApprovalTab) {
      dispatch(fetchPendingApprovals());
    }
  };

  const handleOpenDetailDialog = (request) => {
    setSelectedRequestForDetail(request);
    setOpenDetailDialog(true);
  };
  
  const handleCloseDetailDialog = () => {
    setSelectedRequestForDetail(null);
    setOpenDetailDialog(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Determine which requests to show in the "Approvals" tab
  const requestsForApproval = pendingApprovals;

  // Refresh button handler
  const handleRefreshData = () => {
    if (activeTab === 0) {
      dispatch(fetchMyLeaveRequests());
    } else if (activeTab === 1 && showApprovalTab) {
      dispatch(fetchPendingApprovals());
    }
  };

  console.log("LeaveDashboardPage - actionLoading state:", actionLoading);
  console.log("leave balances:", paidBalance, sickBalance);
  return (
    <Box sx={{ p: { xs: 1, sm: 2, md:3 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant={isMobile ? "h5" : "h4"} component="h1">
          Leave Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenRequestForm}
          
          disabled={actionLoading === "pending"}
        >
          Apply
        </Button>
        
      </Box>

      {/* Leave Balances */}
      <LeaveBalanceDisplay paid={paidBalance} sick={sickBalance} />

      {/* Tabs for My Requests / Approvals */}
      <Paper sx={{ mt: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="My Requests" />
          {showApprovalTab && <Tab label="Pending Approvals" />}
        </Tabs>

        <Box sx={{ p: { xs: 1, sm: 2 } }}>
          {/* Loading Indicator - Show only during active loading */}
          {loading === "pending" && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress />
            </Box>
          )}
          
          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {typeof error === "string" ? error : "Failed to load leave data."}
            </Alert>
          )}

          {/* My Requests Tab Content */}
          {activeTab === 0 && loading !== "pending" && (
            <LeaveRequestList
              title="My Leave History"
              requests={myRequests}
              loading={false}
              currentUserId={currentUser?.id}
              onCardClick={handleOpenDetailDialog} // Pass handler to open detail view
              // Pass handlers for cancel/edit if needed later
            />
          )}

          {/* Approvals Tab Content */}
          {activeTab === 1 && showApprovalTab && loading !== "pending" && (
            <LeaveRequestList
              title="Requests Awaiting My Approval"
              requests={requestsForApproval}
              loading={false}
              currentUserId={currentUser?.id}
              // DO NOT pass onCardClick here
              onActionClick={handleOpenApprovalDialog} // Pass handler to open dialog
              isApprovalList={true} // Flag to show action buttons
            />
          )}
        </Box>
      </Paper>

      {/* Dialogs */}
      <LeaveRequestForm
        open={openRequestForm}
        onClose={handleCloseRequestForm}
        paidBalance={paidBalance} // Pass balances to form
        sickBalance={sickBalance}
      />

      {selectedRequestForAction && (
        <LeaveApprovalDialog
          open={openApprovalDialog}
          onClose={handleCloseApprovalDialog}
          request={selectedRequestForAction}
          currentUserRole={userRole}
        />
      )}

      {/* Detail Dialog */}
      <LeaveDetailDialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        request={selectedRequestForDetail}
      />

      {/* Snackbar for feedback */}
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </Box>
  );
}

export default LeaveDashboardPage;
