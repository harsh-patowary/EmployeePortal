import React, { useState, useEffect } from "react"; // Import useEffect
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Grid,
  Divider,
  FormHelperText,
} from "@mui/material";
import {
  approveManagerLeaveRequest,
  rejectManagerLeaveRequest,
  approveHrLeaveRequest,
  rejectHrLeaveRequest,
  selectLeaveActionLoading,
  selectLeaveActionError,
  resetLeaveActionStatus, // Import the reset action
} from "../slices/leaveSlice"; // Adjust path as needed
import { format, parseISO } from "date-fns";

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch (e) {
    return dateString; // Fallback
  }
};

const ApprovalActionDialog = ({ open, onClose, request, currentUserRole }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectLeaveActionLoading) === "pending";
  const error = useSelector(selectLeaveActionError);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Reset local state when the dialog opens or request changes
  useEffect(() => {
    if (open) {
      setRejectionReason("");
      setShowRejectionInput(false);
      setValidationError("");
      // Reset slice error state when dialog opens
      dispatch(resetLeaveActionStatus());
    }
    
    // Clean up function to reset state when component unmounts or dialog closes
    return () => {
      if (!open) {
        dispatch(resetLeaveActionStatus());
      }
    };
  }, [open, request, dispatch]); // Add dispatch to dependency array

  const isManagerAction =
    request?.status === "pending" &&
    ["manager", "admin", "director"].includes(currentUserRole); // Allow admin/director to act as manager if needed
  const isHrAction =
    request?.status === "manager_approved" &&
    ["hr", "admin", "director"].includes(currentUserRole);

  const handleApprove = async () => {
    setValidationError("");
    setShowRejectionInput(false); // Ensure rejection input is hidden
    
    let actionToDispatch;
    let thunkCreator; // Store the base thunk creator
    
    if (isManagerAction) {
      actionToDispatch = approveManagerLeaveRequest(request.id);
      thunkCreator = approveManagerLeaveRequest; // Base creator for matching
    } else if (isHrAction) {
      actionToDispatch = approveHrLeaveRequest(request.id);
      thunkCreator = approveHrLeaveRequest; // Base creator for matching
    } else {
      console.error(
        "Invalid state for approval action. Request Status:",
        request?.status,
        "User Role:",
        currentUserRole
      );
      setValidationError("Cannot perform approval in the current state."); // Show user feedback
      return;
    }

    // Dispatch the action
    try {
      const resultAction = await dispatch(actionToDispatch);

      // Check if the dispatched action was fulfilled
      if (thunkCreator.fulfilled.match(resultAction)) {
        onClose(); // Close on success
      } else if (thunkCreator.rejected.match(resultAction)) {
        // Show local error message
        setValidationError(resultAction.payload?.detail || resultAction.payload || "Approval failed");
        // Reset the global action status after a short delay
        setTimeout(() => dispatch(resetLeaveActionStatus()), 500);
      }
    } catch (error) {
      console.error("Error in approve action:", error);
      setValidationError("An unexpected error occurred");
      dispatch(resetLeaveActionStatus());
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setValidationError("Rejection reason is required.");
      return;
    }
    setValidationError("");

    let actionToDispatch;
    let thunkCreator; // Store the base thunk creator
    // Ensure payload matches slice definition { requestId, reason }
    const payload = { requestId: request.id, reason: rejectionReason };

    if (isManagerAction) {
      actionToDispatch = rejectManagerLeaveRequest(payload);
      thunkCreator = rejectManagerLeaveRequest; // Base creator for matching
    } else if (isHrAction) {
      actionToDispatch = rejectHrLeaveRequest(payload);
      thunkCreator = rejectHrLeaveRequest; // Base creator for matching
    } else {
      console.error(
        "Invalid state for rejection action. Request Status:",
        request?.status,
        "User Role:",
        currentUserRole
      );
      setValidationError("Cannot perform rejection in the current state."); // Show user feedback
      return;
    }

    // Dispatch the action
    try {
      const resultAction = await dispatch(actionToDispatch);

      // Check if the dispatched action was fulfilled
      if (thunkCreator.fulfilled.match(resultAction)) {
        onClose(); // Close on success
      } else if (thunkCreator.rejected.match(resultAction)) {
        // Show local error message
        setValidationError(resultAction.payload?.detail || resultAction.payload || "Rejection failed");
        // Reset the global action status after a short delay
        setTimeout(() => dispatch(resetLeaveActionStatus()), 500);
      }
    } catch (error) {
      console.error("Error in reject action:", error);
      setValidationError("An unexpected error occurred");
      dispatch(resetLeaveActionStatus());
    }
  };

  // Use this consolidated close handler for the Cancel button and clicking outside
  const handleCloseDialog = () => {
    // Reset local state before closing
    setShowRejectionInput(false);
    setRejectionReason("");
    setValidationError("");
    // Reset potential errors in the slice if desired
    dispatch(resetLeaveActionStatus());
    onClose(); // Call the parent's close handler
  };

  if (!request) return null;

  // Determine if any action is possible for the current user and request state
  const canTakeAction = isManagerAction || isHrAction;

  return (
    // Use handleCloseDialog for the Dialog's onClose prop
    <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Review Leave Request #{request.id}</DialogTitle>
      <DialogContent>
        {/* ... (Grid for request details remains the same) ... */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Employee:
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>
              {request.employee_details?.first_name}{" "}
              {request.employee_details?.last_name}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Leave Type:
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography sx={{ textTransform: "capitalize" }}>
              {request.leave_type}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Start Date:
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>{formatDate(request.start_date)}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              End Date:
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>{formatDate(request.end_date)}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Duration:
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>{request.duration_days} day(s)</Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Reason:
            </Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>
              {request.reason || "No reason provided."}
            </Typography>
          </Grid>
        </Grid>

        {/* Only show rejection input if the user can take action */}
        {canTakeAction && showRejectionInput && (
          <TextField
            fullWidth
            label="Reason for Rejection"
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value);
              if (validationError) setValidationError(""); // Clear validation error on change
            }}
            multiline
            rows={3}
            margin="normal"
            required
            error={!!validationError} // Show error state if validationError exists
            helperText={validationError} // Display validation message
            disabled={loading} // Disable while loading
          />
        )}

        {/* Display general error from slice OR local validation error */}
        {/* Prioritize local validation error */}
        {!validationError && error && typeof error === "string" && (
          <FormHelperText error sx={{ textAlign: "center", mt: 1 }}>
            {error}
          </FormHelperText>
        )}
        {!validationError && error?.detail && (
          <FormHelperText error sx={{ textAlign: "center", mt: 1 }}>
            {error.detail}
          </FormHelperText>
        )}
        {/* Show other potential error formats if needed */}
        {!validationError &&
          error &&
          typeof error === "object" &&
          !error.detail && (
            <FormHelperText error sx={{ textAlign: "center", mt: 1 }}>
              {JSON.stringify(error)}
            </FormHelperText>
          )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {/* Use handleCloseDialog for the Cancel button */}
        <Button onClick={handleCloseDialog} disabled={loading}>
          Cancel
        </Button>

        {/* Only show action buttons if the user can take action */}
        {canTakeAction && (
            <>
              {" "}
              {/* <--- THIS FRAGMENT WRAPS THE BUTTONS */}
              {!showRejectionInput ? (
                <Button
                  onClick={() => {
                    setShowRejectionInput(true);
                    setValidationError(""); // Clear validation error when switching to reject
                  }}
                  color="error"
                  variant="outlined"
                  disabled={loading} // Only disable based on loading
                >
                  Reject
                </Button>
              ) : (
                // Show Confirm Rejection button when input is visible
                <Button
                  onClick={handleReject}
                  color="error"
                  variant="contained"
                  disabled={loading || !rejectionReason.trim()} // Disable if loading or reason is empty
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Confirm Rejection"
                  )}
                </Button>
              )}
              {/* This Button is a sibling to the conditional Reject/Confirm button */}
              <Button
                onClick={handleApprove}
                color="success"
                variant="contained"
                // Disable Approve if loading OR if rejection input is shown (to avoid accidental clicks)
                disabled={loading || showRejectionInput}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Approve"
                )}
              </Button>
            </>
         )}
      </DialogActions>
    </Dialog>
  );
};

export default ApprovalActionDialog;
