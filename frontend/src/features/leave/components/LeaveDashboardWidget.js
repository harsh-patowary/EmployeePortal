import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Divider,
  Skeleton,
  Button,
  useTheme,
  alpha,
  Tooltip,
  Badge,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { format } from "date-fns";

import {
  fetchMyLeaveRequests,
  fetchPendingApprovals,
  selectMyLeaveRequests,
  selectPendingApprovalRequests,
  selectLeaveLoading,
} from "../slices/leaveSlice";
import { selectIsManager, selectRole } from "../../../redux/employeeSlice";

const LeaveDashboardWidget = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Selectors
  const myRequests = useSelector(selectMyLeaveRequests);
  const pendingApprovals = useSelector(selectPendingApprovalRequests);
  const loading = useSelector(selectLeaveLoading);
  const isManager = useSelector(selectIsManager);
  const userRole = useSelector(selectRole);

  // Only managers and above can see pending approvals
  const canSeeApprovals =
    isManager || ["hr", "admin", "director"].includes(userRole);

  // State to track if data has been loaded
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Always fetch the user's own requests
      await dispatch(fetchMyLeaveRequests());

      // Only fetch pending approvals if user has permission
      if (canSeeApprovals) {
        await dispatch(fetchPendingApprovals());
      }

      setHasLoaded(true);
    };

    loadData();
  }, [dispatch, canSeeApprovals]);

  // Get leave status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return {
          color: "success",
          icon: <CheckCircleOutlineIcon fontSize="small" />,
        };
      case "rejected":
        return { color: "error", icon: <ErrorOutlineIcon fontSize="small" /> };
      case "pending":
        return {
          color: "warning",
          icon: <HourglassEmptyIcon fontSize="small" />,
        };
      case "manager_approved":
        return { color: "info", icon: <PendingActionsIcon fontSize="small" /> };
      case "cancelled":
        return { color: "default", icon: <EventBusyIcon fontSize="small" /> };
      default:
        return { color: "default", icon: null };
    }
  };

  const formatDateRange = (start, end) => {
    if (!start || !end) return "Invalid dates";

    const startDate = new Date(start);
    const endDate = new Date(end);

    // If same day
    if (startDate.toDateString() === endDate.toDateString()) {
      return format(startDate, "MMM d, yyyy");
    }

    // If same month
    if (
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear()
    ) {
      return `${format(startDate, "MMM d")} - ${format(endDate, "d, yyyy")}`;
    }

    // Different months
    return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  };

  const renderLeaveList = (requests, limit = 2) => {
    if (loading === "pending" && !hasLoaded) {
      return Array(limit)
        .fill(0)
        .map((_, index) => (
          <ListItem key={index} disablePadding sx={{ py: 1 }}>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={60}
              animation="wave"
            />
          </ListItem>
        ));
    }

    if (requests.length === 0) {
      return (
        <Box
          sx={{
            py: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "text.secondary",
          }}
        >
          <EventBusyIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
          <Typography variant="body2">No leave requests found</Typography>
        </Box>
      );
    }

    return requests.slice(0, limit).map((request) => {
      const statusInfo = getStatusColor(request.status);

      return (
        <ListItem
          key={request.id}
          disablePadding
          sx={{
            py: 1,
            px: 1,
            borderRadius: 1,
            mb: 0.5,
            transition: "0.2s",
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
        >
          <Box sx={{ width: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 500 }}>
                {request.leave_type
                  ? `${
                      request.leave_type.charAt(0).toUpperCase() +
                      request.leave_type.slice(1)
                    } Leave`
                  : "Leave Request"}
              </Typography>
              <Chip
                size="small"
                label={request.status?.replace("_", " ") || "Unknown"}
                color={statusInfo.color}
                icon={statusInfo.icon}
                sx={{
                  height: 24,
                  "& .MuiChip-label": { px: 1 },
                  textTransform: "capitalize",
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.75rem" }}
              >
                {formatDateRange(request.start_date, request.end_date)}
                &nbsp;•&nbsp;
                {request.duration} {request.duration === 1 ? "day" : "days"}
              </Typography>

              {canSeeApprovals && (request.employee_details || request.employee) && (
                <Tooltip
                  title={`${(request.employee_details?.first_name || request.employee?.first_name || '')} ${(request.employee_details?.last_name || request.employee?.last_name || '')}`}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.75rem" }}
                  >
                    {request.employee_details?.first_name || request.employee?.first_name || ''}
                    {' '}
                    {(request.employee_details?.last_name && request.employee_details.last_name.charAt(0)) || 
                     (request.employee?.last_name && request.employee.last_name.charAt(0)) || 
                     ''}
                    {((request.employee_details?.last_name || request.employee?.last_name) ? '.' : '')}
                  </Typography>
                </Tooltip>
              )}
            </Box>
          </Box>
        </ListItem>
      );
    });
  };

  // Count of pending approvals that need the user's attention
  const approvalCount = pendingApprovals?.length || 0;

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardHeader
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">Leave Management</Typography>
            {canSeeApprovals && approvalCount > 0 && (
              <Badge badgeContent={approvalCount} color="error" sx={{ mr: 1 }}>
                <PendingActionsIcon color="action" />
              </Badge>
            )}
          </Box>
        }
        action={
          <Tooltip title="View all leaves">
            <IconButton component={RouterLink} to="/leave">
              <ArrowForwardIcon />
            </IconButton>
          </Tooltip>
        }
        sx={{ pb: 0 }}
      />

      <CardContent
        sx={{ display: "flex", flexDirection: "column", flexGrow: 1, pt: 1 }}
      >
        {/* My Recent Leaves Section */}
        <Box
          sx={{
            mb: canSeeApprovals ? 2 : 0,
            flexGrow: canSeeApprovals ? 0 : 1,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            My Recent Leaves
          </Typography>

          <List dense disablePadding>
            {renderLeaveList(myRequests, 2)}
          </List>

          {myRequests.length > 2 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Button
                component={RouterLink}
                to="/leave"
                size="small"
                endIcon={<ArrowForwardIcon />}
              >
                View All My Leaves
              </Button>
            </Box>
          )}
        </Box>

        {/* Pending Approvals Section - Only for managers and above */}
        {canSeeApprovals && (
          <>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
                sx={{ display: "flex", alignItems: "center" }}
              >
                Pending Approvals
                {approvalCount > 0 && (
                  <Chip
                    size="small"
                    label={approvalCount}
                    color="error"
                    sx={{ ml: 1, height: 20, minWidth: 20 }}
                  />
                )}
              </Typography>

              <List dense disablePadding>
                {renderLeaveList(pendingApprovals, 2)}
              </List>

              {pendingApprovals.length > 2 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                  <Button
                    component={RouterLink}
                    to="/leave"
                    size="small"
                    color={approvalCount > 0 ? "error" : "primary"}
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => {}}
                  >
                    Review Pending Approvals
                  </Button>
                </Box>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveDashboardWidget;
