
"use client";
import React, { useState, useEffect } from "react";
import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { ShoppingBagIcon, CurrencyRupeeIcon, ClockIcon } from "@heroicons/react/24/outline";
// import ShoppingBagSolid from "@/public/window.svg";
// import CurrencyRupeeSolid from "@/public/vercel.svg";
// import ChartBarSolid from "@/public/globe.svg";

import {
  ChartBarIcon as ChartBarSolid,
  CurrencyRupeeIcon as CurrencyRupeeSolid,
  ShoppingBagIcon as ShoppingBagSolid,
} from "@heroicons/react/24/solid";


import { getOrderDashboard, OrderDashboardResponse } from "@/api/Report/page";

const ReportsPage = () => {
  const [dashboard, setDashboard] = useState<OrderDashboardResponse | null>(null);
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
      setError(err.message || 'Failed to fetch dashboard report');
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

  // Export reports data (disabled: implement if needed for API data)
  const handleExport = () => {
    // Implement export using dashboard data if needed
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Orders Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : currentStats?.totalOrders ?? '-'}
              </p>
              <div className="flex items-center mt-2">
                <ShoppingBagIcon className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm font-medium text-blue-600">
                  Pending: {currentStats?.pendingDeliveryOrdersCount ?? 0} delivery, {currentStats?.pendingDineInOrdersCount ?? 0} dine-in
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
              <ShoppingBagSolid className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : formatCurrency(Number(currentStats?.totalRevenue ?? 0))}
              </p>
              <div className="flex items-center mt-2">
                <CurrencyRupeeIcon className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-sm font-medium text-emerald-600">
                  Avg Order Value: {loading ? '...' : formatCurrency(Number(currentStats?.avgOrderValue ?? 0))}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl">
              <CurrencyRupeeSolid className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Recent Orders Card (API) */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Recent Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : currentStats?.recentOrders?.length ?? 0}
              </p>
              <div className="flex items-center mt-2">
                <ClockIcon className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-sm font-medium text-orange-600">
                  Last 3 orders
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
              <ChartBarSolid className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table (API) */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Recent Orders
              </h2>
              <p className="text-gray-600 mt-1">
                Last 3 orders for {getPeriodLabel(selectedPeriod).toLowerCase()}
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-400">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-red-400">{error}</td></tr>
              ) : !currentStats?.recentOrders?.length ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-400">No recent orders</td></tr>
              ) : (
                currentStats.recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-blue-700">{order._id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">
                      {order.deliveryDetails ? `${order.deliveryDetails.firstName} ${order.deliveryDetails.lastName}` : `${order.dineInDetails?.firstName} ${order.dineInDetails?.lastName}`}
                    </td>
                                        <td className="px-6 py-4 whitespace-nowrap capitalize">{order.orderType}</td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'ready'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                      }`}>
                      {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-700 font-bold">{(order.grandTotal)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
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
