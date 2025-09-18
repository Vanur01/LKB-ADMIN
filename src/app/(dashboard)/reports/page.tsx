"use client";
import React, { useState, useEffect } from "react";
import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  ShoppingBagIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";

import {
  ChartBarIcon as ChartBarSolid,
  CurrencyRupeeIcon as CurrencyRupeeSolid,
  ShoppingBagIcon as ShoppingBagSolid,
} from "@heroicons/react/24/solid";

import { getOrderDashboard, OrderDashboardResponse } from "@/api/Report/page";

const ReportsPage = () => {
  const [dashboard, setDashboard] = useState<OrderDashboardResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("today");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchDashboard = async (period: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrderDashboard(period as any);
      setDashboard(res);
    } catch (err: any) {
      setError(err.message || "Failed to fetch dashboard report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(selectedPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const currentStats = dashboard?.result;

  // Refresh orders data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboard(selectedPeriod);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const handleExport = () => {
    if (!dashboard?.result) {
      setError("No data to export");
      return;
    }

    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Prepare Dashboard Metrics Sheet
      const metricsData = [
        ["Metric", "Value"],
        ["Total Orders", currentStats?.totalOrders ?? 0],
        ["Total Revenue", `₹${currentStats?.totalRevenue ?? 0}`],
        ["Average Order Value", `₹${currentStats?.avgOrderValue ?? 0}`],
        ["Completed Delivery Orders", currentStats?.completedDeliveryOrdersCount ?? 0],
        ["Completed Dine-in Orders", currentStats?.completedDineInOrdersCount ?? 0],
        ["Report Period", getPeriodLabel(selectedPeriod)],
        ["Generated On", new Date().toLocaleString()],
      ];

      const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
      XLSX.utils.book_append_sheet(wb, metricsSheet, "Dashboard Metrics");

      // Prepare Recent Orders Sheet (if data exists)
      if (currentStats?.recentOrders?.length) {
        const ordersData = [
          [
            "Order ID",
            "Customer Name",
            "Customer Phone",
            "Order Type",
            "Status",
            "Payment Status",
            "Amount (₹)",
            "Table/Address",
            "Delivery Boy",
            "Items Count",
            "Date & Time",
          ],
          ...currentStats.recentOrders.map((order) => [
            order.orderId || order._id,
            order.deliveryDetails
              ? `${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}`
              : `${order.dineInDetails?.firstName} ${order.dineInDetails?.lastName}`,
            order.deliveryDetails?.phone || order.dineInDetails?.phone || "N/A",
            order.orderType === "delivery" ? "Delivery" : "Dine-in",
            order.status === "completed" ? "Out of Delivery" : order.status.charAt(0).toUpperCase() + order.status.slice(1),
            order.paymentStatus,
            order.grandTotal,
            order.orderType === "delivery"
              ? `${order.deliveryDetails?.hostel}, Room ${order.deliveryDetails?.roomNumber}, Floor ${order.deliveryDetails?.floor}`
              : `Table ${order.dineInDetails?.tableNumber}`,
            order.deliveryBoy?.name || "Not Assigned",
            order.items?.length || 0,
            new Date(order.createdAt).toLocaleString(),
          ]),
        ];

        const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);

        // Auto-size columns
        const wscols = [
          { wch: 15 }, // Order ID
          { wch: 20 }, // Customer Name
          { wch: 15 }, // Phone
          { wch: 10 }, // Type
          { wch: 12 }, // Status
          { wch: 15 }, // Payment Status
          { wch: 12 }, // Amount
          { wch: 30 }, // Address
          { wch: 20 }, // Delivery Boy
          { wch: 12 }, // Items Count
          { wch: 20 }, // Date
        ];
        ordersSheet["!cols"] = wscols;

        XLSX.utils.book_append_sheet(wb, ordersSheet, "Recent Orders");
      }

      // Prepare Completed Delivery Orders Sheet
      if (currentStats?.completedDeliveryOrders?.length) {
        const deliveryOrdersData = [
          [
            "Order ID",
            "Customer Name",
            "Customer Phone",
            "Status",
            "Payment Status",
            "Amount (₹)",
            "Delivery Charges (₹)",
            "Delivery Boy",
            "Delivery Boy Phone",
            "Hostel",
            "Room Number",
            "Floor",
            "Items Count",
            "Date & Time",
          ],
          ...currentStats.completedDeliveryOrders.map((order) => [
            order.orderId || order._id,
            order.deliveryDetails
              ? `${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}`
              : "N/A",
            order.deliveryDetails?.phone || "N/A",
            "Out of Delivery",
            order.paymentStatus,
            order.grandTotal,
            order.deliveryCharges || 0,
            order.deliveryBoy?.name || "Not Assigned",
            order.deliveryBoy?.phone || "N/A",
            order.deliveryDetails?.hostel || "N/A",
            order.deliveryDetails?.roomNumber || "N/A",
            order.deliveryDetails?.floor || "N/A",
            order.items?.length || 0,
            new Date(order.createdAt).toLocaleString(),
          ]),
        ];

        const deliveryOrdersSheet = XLSX.utils.aoa_to_sheet(deliveryOrdersData);

        // Auto-size columns for delivery orders
        const deliveryWscols = [
          { wch: 15 }, // Order ID
          { wch: 20 }, // Customer Name
          { wch: 15 }, // Phone
          { wch: 15 }, // Status
          { wch: 15 }, // Payment Status
          { wch: 12 }, // Amount
          { wch: 15 }, // Delivery Charges
          { wch: 20 }, // Delivery Boy
          { wch: 15 }, // Delivery Boy Phone
          { wch: 20 }, // Hostel
          { wch: 12 }, // Room Number
          { wch: 10 }, // Floor
          { wch: 12 }, // Items Count
          { wch: 20 }, // Date
        ];
        deliveryOrdersSheet["!cols"] = deliveryWscols;

        XLSX.utils.book_append_sheet(wb, deliveryOrdersSheet, "Completed Delivery Orders");
      }

      // Prepare Completed Dine-in Orders Sheet
      if (currentStats?.completedDineInOrders?.length) {
        const dineInOrdersData = [
          [
            "Order ID",
            "Customer Name",
            "Customer Phone",
            "Status",
            "Payment Status",
            "Amount (₹)",
            "Table Number",
            "Items Count",
            "Date & Time",
          ],
          ...currentStats.completedDineInOrders.map((order) => [
            order.orderId || order._id,
            order.dineInDetails
              ? `${order.dineInDetails.firstName} ${order.dineInDetails.lastName}`
              : "N/A",
            order.dineInDetails?.phone || "N/A",
            "Completed",
            order.paymentStatus,
            order.grandTotal,
            order.dineInDetails?.tableNumber || "N/A",
            order.items?.length || 0,
            new Date(order.createdAt).toLocaleString(),
          ]),
        ];

        const dineInOrdersSheet = XLSX.utils.aoa_to_sheet(dineInOrdersData);

        // Auto-size columns for dine-in orders
        const dineInWscols = [
          { wch: 15 }, // Order ID
          { wch: 20 }, // Customer Name
          { wch: 15 }, // Phone
          { wch: 12 }, // Status
          { wch: 15 }, // Payment Status
          { wch: 12 }, // Amount
          { wch: 12 }, // Table Number
          { wch: 12 }, // Items Count
          { wch: 20 }, // Date
        ];
        dineInOrdersSheet["!cols"] = dineInWscols;

        XLSX.utils.book_append_sheet(wb, dineInOrdersSheet, "Completed Dine-in Orders");
      }

      // Add Order Items Details Sheet (if data exists and items are available)
      const allOrdersWithItems = [
        ...(currentStats?.recentOrders || []),
        ...(currentStats?.completedDeliveryOrders || []),
        ...(currentStats?.completedDineInOrders || []),
      ];

      if (allOrdersWithItems.length > 0) {
        const itemsData = [
          ["Order ID", "Order Type", "Customer Name", "Item Name", "Quantity", "Unit Price", "Total Price"],
        ];

        allOrdersWithItems.forEach((order) => {
          if (order.items && order.items.length > 0) {
            const customerName = order.deliveryDetails
              ? `${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}`
              : order.dineInDetails
              ? `${order.dineInDetails.firstName} ${order.dineInDetails.lastName}`
              : "N/A";
            
            const orderType = order.orderType === "delivery" ? "Delivery" : "Dine-in";
            
            order.items.forEach((item) => {
              itemsData.push([
                order.orderId || order._id,
                orderType,
                customerName,
                item.name,
                item.quantity.toString(),
                `₹${item.price}`,
                `₹${item.quantity * item.price}`,
              ]);
            });
          }
        });

        if (itemsData.length > 1) {
          // Only add if there are items
          const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
          const itemsCols = [
            { wch: 15 }, // Order ID
            { wch: 12 }, // Order Type
            { wch: 20 }, // Customer Name
            { wch: 25 }, // Item Name
            { wch: 10 }, // Quantity
            { wch: 12 }, // Unit Price
            { wch: 12 }, // Total Price
          ];
          itemsSheet["!cols"] = itemsCols;
          XLSX.utils.book_append_sheet(wb, itemsSheet, "All Order Items");
        }
      }

      // Generate Excel file and trigger download
      const fileName = `Restaurant_Report_${getPeriodLabel(
        selectedPeriod
      ).replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);

      // Show success message (optional)
      console.log(`Excel file exported: ${fileName}`);
    } catch (err) {
      setError("Failed to export data");
      console.error("Export error:", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "today":
        return "Today";
      case "weekly":
        return "This Week";
      case "monthly":
        return "This Month";
      default:
        return "Today";
    }
  };

  // Payment status functions
  const getPaymentStatusIcon = (
    paymentStatus: "SUCCESS" | "PENDING" | "FAILED" | "COMPLETED"
  ) => {
    switch (paymentStatus) {
      case "SUCCESS":
      case "COMPLETED":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "PENDING":
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case "FAILED":
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPaymentStatusColor = (
    paymentStatus: "SUCCESS" | "PENDING" | "FAILED" | "COMPLETED"
  ) => {
    switch (paymentStatus) {
      case "SUCCESS":
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Track your restaurant's performance and insights
          </p>
        </div>

        <div className="flex flex-col gap-3 items-end">
          <div className="flex items-center text-xs text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${
                isRefreshing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <ArrowPathIcon
                className={`h-5 w-5 text-gray-500 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-gray-200 w-fit">
          {["today", "weekly", "monthly"].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? "bg-orange-600 text-white border-2 border-orange-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {getPeriodLabel(period)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards (API) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Orders Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? "..." : currentStats?.totalOrders ?? "-"}
              </p>
              <div className="flex items-center mt-2">
                <ShoppingBagIcon className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm font-medium text-blue-600">
                  All orders
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
              <ShoppingBagSolid className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading
                  ? "..."
                  : formatCurrency(Number(currentStats?.totalRevenue ?? 0))}
              </p>
              <div className="flex items-center mt-2">
                <CurrencyRupeeIcon className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-sm font-medium text-emerald-600">
                  Revenue generated
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl">
              <CurrencyRupeeSolid className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Average Order Value Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading
                  ? "..."
                  : formatCurrency(Number(currentStats?.avgOrderValue ?? 0))}
              </p>
              <div className="flex items-center mt-2">
                <CurrencyRupeeIcon className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-sm font-medium text-purple-600">
                  Per order
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
              <ChartBarSolid className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Completed Deliveries Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Completed Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? "..." : (currentStats?.completedDeliveryOrdersCount ?? 0) + (currentStats?.completedDineInOrdersCount ?? 0)}
              </p>
              <div className="flex items-center mt-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-medium text-green-600">
                  Delivery: {currentStats?.completedDeliveryOrdersCount ?? 0}, Dine-in: {currentStats?.completedDineInOrdersCount ?? 0}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table (API) */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <p className="text-gray-600 mt-1">
                Latest orders for {getPeriodLabel(selectedPeriod).toLowerCase()}
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Boy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-red-400"
                  >
                    {error}
                  </td>
                </tr>
              ) : !currentStats?.recentOrders?.length ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-400"
                  >
                    No recent orders
                  </td>
                </tr>
              ) : (
                currentStats.recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-blue-700 font-medium">
                        {order.orderId || order._id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">
                          {order.deliveryDetails
                            ? `${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}`
                            : `${order.dineInDetails?.firstName} ${order.dineInDetails?.lastName}`}
                        </div>
                        <div className="text-gray-500">
                          {order.deliveryDetails?.phone || order.dineInDetails?.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.orderType === "delivery" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {order.orderType === "delivery" ? "Delivery" : "Dine-in"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "ready"
                            ? "bg-green-100 text-green-800"
                            : order.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "cancel"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status === "completed"
                          ? "Out of Delivery"
                          : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPaymentStatusIcon(order.paymentStatus)}
                        <span
                          className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.deliveryBoy ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {order.deliveryBoy.name}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {order.deliveryBoy.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-bold text-green-600">
                          ₹{order.grandTotal}
                        </div>
                        {order.deliveryCharges && order.deliveryCharges > 0 && (
                          <div className="text-xs text-gray-500">
                            +₹{order.deliveryCharges} delivery
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed Delivery Orders Table */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Completed Delivery Orders</h2>
              <p className="text-gray-600 mt-1">
                All completed delivery orders for {getPeriodLabel(selectedPeriod).toLowerCase()}
              </p>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {currentStats?.completedDeliveryOrders?.length || 0} orders
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Boy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : !currentStats?.completedDeliveryOrders?.length ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
                    No completed delivery orders
                  </td>
                </tr>
              ) : (
                currentStats.completedDeliveryOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-blue-700 font-medium">
                        {order.orderId || order._id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">
                          {order.deliveryDetails
                            ? `${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}`
                            : "N/A"}
                        </div>
                        <div className="text-gray-500">
                          {order.deliveryDetails?.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        Out of Delivery
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPaymentStatusIcon(order.paymentStatus)}
                        <span
                          className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.deliveryBoy ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {order.deliveryBoy.name}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {order.deliveryBoy.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-bold text-green-600">
                          ₹{order.grandTotal}
                        </div>
                        {order.deliveryCharges && order.deliveryCharges > 0 && (
                          <div className="text-xs text-gray-500">
                            +₹{order.deliveryCharges} delivery
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.deliveryDetails ? (
                        <div>
                          <div className="font-medium">{order.deliveryDetails.hostel}</div>
                          <div className="text-xs">
                            Room {order.deliveryDetails.roomNumber}, Floor {order.deliveryDetails.floor}
                          </div>
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed Dine-in Orders Table */}
      <div className="bg-white rounded-xl border-2  border-gray-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Completed Dine-in Orders</h2>
              <p className="text-gray-600 mt-1">
                All completed dine-in orders for {getPeriodLabel(selectedPeriod).toLowerCase()}
              </p>
            </div>
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              {currentStats?.completedDineInOrders?.length || 0} orders
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : !currentStats?.completedDineInOrders?.length ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
                    No completed dine-in orders
                  </td>
                </tr>
              ) : (
                currentStats.completedDineInOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-blue-700 font-medium">
                        {order.orderId || order._id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">
                          {order.dineInDetails
                            ? `${order.dineInDetails.firstName} ${order.dineInDetails.lastName}`
                            : "N/A"}
                        </div>
                        <div className="text-gray-500">
                          {order.dineInDetails?.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                        Completed
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPaymentStatusIcon(order.paymentStatus)}
                        <span
                          className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-green-600">
                        ₹{order.grandTotal}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                        Table {order.dineInDetails?.tableNumber || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {order.items?.length || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
