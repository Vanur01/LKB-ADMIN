"use client";

import React, { useState, useEffect } from "react";
import {
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  HomeIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  CurrencyRupeeIcon as CurrencyRupeeSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  UsersIcon as UsersSolid,
  ChartBarIcon as ChartBarSolid,
} from "@heroicons/react/24/solid";
import {
  getRevenueDashboard,
} from "@/api/Dashboard/page";

// Define the types to match the API response
type Category = {
  _id: string;
  name: string;
};

type MenuItem = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  isVeg: boolean;
  image: string;
  isAvailable: boolean;
};

type TopSellingItem = {
  menuDetails: MenuItem;
  totalQuantity: number;
  totalRevenue: number;
};

type TopCategory = {
  category: Category;
  total: number;
};

type RevenueDashboardResult = {
  revenue: {
    today: number;
    weekly: number;
    monthly: number;
  };
  topSellingItems: TopSellingItem[];
  topCategories: TopCategory[];
  hourlyOrderTrends: number[];
};
import { getAllOrders } from "@/api/Order/page";

type OrderItem = {
  menuId: string;
  name: string;
  quantity: number;
  price: number;
  _id: string;
};

type Order = {
  id: string;
  customer: string;
  type: "dinein" | "delivery";
  tableOrAddress: string;
  grandTotal: number;
  status: "pending" | "ready" | "delivered" | "cancelled";
  payment: {
    amount: number;
    method: "UPI" | "Card" | "Wallet";
  };
  paymentStatus: "SUCCESS" | "PENDING" | "FAILED";
  items?: OrderItem[];
  date: string;
  time: string;
};

const DashboardPage = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "weekly" | "monthly"
  >("today");

  const [dashboardData, setDashboardData] =
    useState<RevenueDashboardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (period: "today" | "weekly" | "monthly") => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRevenueDashboard(period);
      const apiData = res.result;
      
      // Transform the API response to match our expected type
      const transformedData: RevenueDashboardResult = {
        revenue: apiData.revenue,
        topSellingItems: apiData.topSellingItems.map(item => ({
          menuDetails: {
            ...item.menuDetails,
            category: item.menuDetails.category as unknown as Category
          },
          totalQuantity: item.totalQuantity,
          totalRevenue: item.totalRevenue
        })),
        topCategories: apiData.topCategories.map(cat => ({
          category: cat.category as unknown as Category,
          total: cat.total
        })),
        hourlyOrderTrends: apiData.hourlyOrderTrends
      };
      
      setDashboardData(transformedData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  // Recent Orders State
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Transform API response to Order type 
  const transformApiResponse = (apiOrder: any): Order => {
    // Handle address based on order type
    const address = apiOrder.deliveryDetails
      ? `${apiOrder.deliveryDetails.hostel}, Room ${apiOrder.deliveryDetails.roomNumber}, Floor ${apiOrder.deliveryDetails.floor}`
      : apiOrder.dineInDetails?.tableNumber || "Table Not Assigned";

    // Handle customer name based on order type
    const customer = apiOrder.deliveryDetails
      ? `${apiOrder.deliveryDetails.firstName} ${apiOrder.deliveryDetails.lastName}`
      : apiOrder.dineInDetails
        ? `${apiOrder.dineInDetails.firstName} ${apiOrder.dineInDetails.lastName}`
        : "Unknown Customer";

    return {
      id: apiOrder._id,
      customer: customer,
      type: apiOrder.orderType as "delivery" | "dinein",
      tableOrAddress: address,
      grandTotal: apiOrder.grandTotal || apiOrder.totalAmount,
      status: apiOrder.status.toLowerCase(),
      payment: {
        amount: apiOrder.grandTotal || apiOrder.totalAmount,
        method: "UPI", // Default to UPI since actual method is not in API
      },
      paymentStatus: (apiOrder as any).paymentStatus || (apiOrder.isPaid ? "SUCCESS" : "PENDING"),
      items: apiOrder.items || [],
      date: new Date(apiOrder.createdAt).toLocaleDateString(),
      time: new Date(apiOrder.createdAt).toLocaleTimeString(),
    };
  };

  const fetchRecentOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      // Get 5 most recent orders with no additional filters
      const response = await getAllOrders(1, 5); 
      
      if (response.success && response.result && response.result.data) {
        const orderItems = response.result.data;
        setRecentOrders(orderItems.map(transformApiResponse));
        

      } else {
        setOrdersError("Failed to fetch orders: " + (response.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setOrdersError(err.message || "Failed to fetch recent orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  console.log("Recent Orders:", recentOrders);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  // You can fetch and display pending orders here if needed, using a similar approach as above

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case "ready":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "delivered":
        return <TruckIcon className="h-4 w-4 text-blue-500" />;
      case "cancelled":
        return <TrashIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "";
    }
  };

  // Payment status functions
  const getPaymentStatusIcon = (paymentStatus: "SUCCESS" | "PENDING" | "FAILED") => {
    switch (paymentStatus) {
      case "SUCCESS":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "PENDING":
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case "FAILED":
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPaymentStatusColor = (paymentStatus: "SUCCESS" | "PENDING" | "FAILED") => {
    switch (paymentStatus) {
      case "SUCCESS":
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
    <div className=" bg-gray-50 p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back! Here's your restaurant overview
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 items-end">
            <div className="flex items-center text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
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

        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-gray-200 w-fit">
            {["today", "weekly", "monthly"].map((period) => (
              <button
                key={period}
                onClick={() =>
                  setSelectedPeriod(period as "today" | "weekly" | "monthly")
                }
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? "bg-orange-600 text-white border-2 border-orange-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {period === "today"
                  ? "Today"
                  : period === "weekly"
                  ? "This Week"
                  : "This Month"}
              </button>
            ))}
          </div>
        </div>
        {/* Revenue Cards (Today, This Week, This Month) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Revenue */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Today's Revenue
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {dashboardData
                    ? formatCurrency(dashboardData.revenue.today)
                    : "-"}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl">
                <CurrencyRupeeSolid className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          {/* Weekly Revenue */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  This Week's Revenue
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {dashboardData
                    ? formatCurrency(dashboardData.revenue.weekly)
                    : "-"}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                <CurrencyRupeeSolid className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          {/* Monthly Revenue */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  This Month's Revenue
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {dashboardData
                    ? formatCurrency(dashboardData.revenue.monthly)
                    : "-"}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                <CurrencyRupeeSolid className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-lg font-semibold text-gray-900">
              Top Selling Items
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData?.topSellingItems?.length ? (
                  dashboardData.topSellingItems.map((item) => (
                    <tr key={item.menuDetails._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={item.menuDetails.image}
                          alt={item.menuDetails.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.menuDetails.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.menuDetails.category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.totalQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(item.totalRevenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-400"
                    >
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-lg font-semibold text-gray-900">
              Top Categories
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData?.topCategories?.length ? (
                  dashboardData.topCategories.map((cat) => (
                    <tr key={cat.category._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cat.category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(cat.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-6 py-4 text-center text-gray-400"
                    >
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <ShoppingBagIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Recent Orders
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm cursor-pointer"
                      onClick={() => fetchRecentOrders()}
                      disabled={ordersLoading}
                    >
                      <ArrowPathIcon className={`h-4 w-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                      <span>{ordersLoading ? 'Loading...' : 'Refresh'}</span>
                    </button>
                    <button
                      className="flex items-center space-x-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm cursor-pointer"
                      onClick={() => (window.location.href = "/orders")}
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>View All</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
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
                        Items
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
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ordersLoading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-4 text-center text-gray-400"
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : ordersError ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-4 text-center text-red-400"
                        >
                          {ordersError}
                        </td>
                      </tr>
                    ) : recentOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-4 text-center text-gray-400"
                        >
                          No recent orders
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.customer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap capitalize">
                            <div className="flex items-center">
                              {order.type === 'dinein' ? 
                                <HomeIcon className="h-4 w-4 mr-1 text-blue-500" /> : 
                                <TruckIcon className="h-4 w-4 mr-1 text-green-500" />
                              }
                              {order.type}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {order.tableOrAddress}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              {order.items && order.items.map((item, idx) => (
                                <div key={item._id || idx} className="mb-1 text-sm">
                                  <span className="font-medium">{item.quantity}x</span> {item.name}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getPaymentStatusIcon(order.paymentStatus)}
                              <span
                                className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                                  order.paymentStatus
                                )}`}
                              >
                                {order.paymentStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatCurrency(order.grandTotal)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>{order.date}</div>
                            <div className="text-xs text-gray-500">{order.time}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
