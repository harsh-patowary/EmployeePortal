// filepath: d:\developement\employee_management\frontend\src\features\leave\pages\LeaveDashboardPage.js
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Tabs, // Import Tabs
  Tab, // Import Tab
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  fetchLeaveRequests,
  selectMyLeaveRequests,
  selectPendingManagerApprovalRequests,
  selectPendingHrApprovalRequests,
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
  selectPaidLeaveBalance, // Import balance selectors
  selectSickLeaveBalance,
} from "../../../redux/employeeSlice"; // Adjust path as needed
import LeaveBalanceDisplay from "../components/LeaveBalanceDisplay";
import LeaveRequestList from "../components/LeaveRequestList";
import LeaveRequestForm from "../components/LeaveRequestForm";
import LeaveRequestDetailDialog from "../components/LeaveRequestDetailDialog"; // Import the new dialog
import ApprovalActionDialog from "../components/ApprovalActionDialog";
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
  const managerPending = useSelector(selectPendingManagerApprovalRequests);
  const hrPending = useSelector(selectPendingHrApprovalRequests);
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

  // Check if user has approval roles
  const canApproveManager = isManager; // Simple check, adjust if needed
  const canApproveHr = ["hr", "admin", "director"].includes(userRole);
  const showApprovalTab = canApproveManager || canApproveHr;

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchLeaveRequests());
  }, [dispatch]);

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
      } else if (actionError) {
        // Extract specific error message if available
        const errorMessage =
          typeof actionError === "string"
            ? actionError
            : actionError?.detail ||
              actionError?.reason ||
              "An error occurred.";
        setSnackbar({
          open: true,
          message: `Action failed: ${errorMessage}`,
          severity: "error",
        });
      }
      // Reset status after a short delay to allow snackbar to show
      const timer = setTimeout(() => {
        dispatch(resetLeaveActionStatus());
      }, 3000); // Adjust delay as needed
      return () => clearTimeout(timer);
    }
  }, [actionLoading, actionError, dispatch]);

  const handleOpenRequestForm = () => setOpenRequestForm(true);
  const handleCloseRequestForm = () => setOpenRequestForm(false);

  const handleOpenApprovalDialog = (request) => {
    setSelectedRequestForAction(request);
    setOpenApprovalDialog(true);
  };
  const handleCloseApprovalDialog = () => {
    // Reset slice error state when closing dialog
    dispatch(resetLeaveActionStatus());
    setSelectedRequestForAction(null);
    setOpenApprovalDialog(false);
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
  const requestsForApproval = canApproveHr
    ? hrPending
    : canApproveManager
    ? managerPending
    : [];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
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
          Apply for Leave
        </Button>
      </Box>

      {/* Loading and Error States */}
      {loading === "pending" && (
        <CircularProgress sx={{ display: "block", margin: "auto" }} />
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof error === "string" ? error : "Failed to load leave data."}
        </Alert>
      )}
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
          {/* My Requests Tab Content */}
          {activeTab === 0 && (
            <LeaveRequestList
              title="My Leave History"
              requests={myRequests}
              loading={loading === "pending"}
              currentUserId={currentUser?.id}
              onCardClick={handleOpenDetailDialog} // Pass handler to open detail view
              // Pass handlers for cancel/edit if needed later
            />
          )}

          {/* Approvals Tab Content */}
          {activeTab === 1 && showApprovalTab && (
            <LeaveRequestList
              title="Requests Awaiting My Approval"
              requests={requestsForApproval}
              loading={loading === "pending"}
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
        <ApprovalActionDialog
          open={openApprovalDialog}
          onClose={handleCloseApprovalDialog}
          request={selectedRequestForAction}
          currentUserRole={userRole}
        />
      )}

      {/* Detail Dialog */}
      <LeaveRequestDetailDialog
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
