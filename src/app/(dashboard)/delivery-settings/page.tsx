"use client";

import React, { useEffect, useState } from "react";
import { getDeliveryStatus, toggleDeliveryStatus } from "@/api/Order/page";
import { TruckIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Switch, FormControlLabel, Alert, Snackbar } from "@mui/material";

export default function DeliverySettingsPage() {
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch current delivery status
  useEffect(() => {
    const fetchDeliveryStatus = async () => {
      try {
        setIsLoading(true);
        const response = await getDeliveryStatus();
        console.log("Delivery status fetched:", response.result.isDeliveryEnabled); // Debug log
        setIsDeliveryEnabled(response.result.isDeliveryEnabled);
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to load delivery settings",
          severity: "error"
        });
        console.error("Error fetching delivery status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveryStatus();
  }, []);

  // Handle toggle change
  const handleToggleDelivery = async () => {
    try {
      setIsSaving(true);
      const newState = !isDeliveryEnabled;
      
      // Call API to update delivery status
      const response = await toggleDeliveryStatus(newState);
      
      // Update local state with response from server
      console.log("Delivery status updated to:", response.result.isDeliveryEnabled); // Debug log
      setIsDeliveryEnabled(response.result.isDeliveryEnabled);
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Delivery mode ${response.result.isDeliveryEnabled ? "enabled" : "disabled"} successfully`,
        severity: "success"
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to update delivery settings",
        severity: "error"
      });
      console.error("Error toggling delivery status:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6  space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Delivery Settings</h1>
      
      <div className=" bg-white p-4 border-t border-b border-gray-200 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center space-x-4 ">
            <div className="flex-shrink-0 bg-orange-100 rounded-full p-3">
              <TruckIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Delivery Mode</h2>
              <p className="text-sm text-gray-500">
                {isDeliveryEnabled 
                  ? "Customers can place orders for delivery"
                  : "Delivery service is currently disabled"}
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isDeliveryEnabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isDeliveryEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            {isLoading ? (
              <div className="animate-pulse h-6 w-12 bg-gray-200 rounded-full"></div>
            ) : (
              <FormControlLabel
                control={
                  <Switch
                    checked={isDeliveryEnabled}
                    onChange={handleToggleDelivery}
                    disabled={isSaving}
                    color="success"
                    size="medium"
                  />
                }
                label={isDeliveryEnabled ? "Enabled" : "Disabled"}
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900">About Delivery Mode</h3>
        <div className="mt-2 text-sm text-gray-500">
          <p>
            When delivery mode is enabled, customers can place orders for delivery. When disabled, only 
            dine-in orders will be available. This setting applies to all new orders placed after the change.
          </p>
        </div>
      </div>

      {/* Snackbar notification */}
      {/* <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar> */}
    </div>
  );
}