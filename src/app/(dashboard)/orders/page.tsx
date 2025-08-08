"use client";

import React, { useState, useMemo, useEffect } from "react";
import { getAllOrders, deleteOrder } from "@/api/Order/page";
import { Pagination, Stack } from "@mui/material";
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilSquareIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import ConfirmationModal from "@/components/ConfirmationModal";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import EditOrderModal from "@/components/EditOrderModal";

type OrderItem = {
  id: string;
  name: string;
  category: "Veg" | "Non-Veg";
  quantity: number;
  price: number;
  available: boolean;
};

type Order = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  type: "dinein" | "delivery";
  tableOrAddress: string;
  status: "pending" | "ready" | "delivered" | "cancelled";
  payment: {
    amount: number;
    method: "UPI" | "Card" | "Wallet";
  };
  date: string;
  items?: OrderItem[];
};

const OrderManagement: React.FC = () => {
  // State for delete confirmation modal
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Handle delete order icon click
  const handleDeleteOrderClick = (orderId: string) => {
    setDeleteOrderId(orderId);
    setIsDeleteModalOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteOrderId) return;
    setDeleteLoading(true);
    try {
      await deleteOrder(deleteOrderId);
      setIsDeleteModalOpen(false);
      setDeleteOrderId(null);
      await handleRefresh();
    } catch (err) {
      alert("Failed to delete order.");
    } finally {
      setDeleteLoading(false);
    }
  };
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedPayment, setSelectedPayment] = useState("All Payments");

  // State for refresh functionality
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // State for order details modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for edit order modal
  const [selectedEditOrder, setSelectedEditOrder] = useState<Order | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for orders data and loading
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 30;
  const [statusCounts, setStatusCounts] = useState({
    totalOrder: 0,
    pending: 0,
    ready: 0,
    delivered: 0,
  });

  // Fetch orders on component mount or when filters/page changes
  useEffect(() => {
    handleRefresh();
  }, [searchTerm, selectedStatus, selectedType, selectedPayment, currentPage]); // Refetch when filters or page changes

  // All filtering is now handled by the API
  const filteredOrders = orders;

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("All Status");
    setSelectedType("All Types");
    setSelectedPayment("All Payments");
  };

  // Transform API response to Order type
  const transformApiResponse = (apiOrder: any): Order => {
    let firstName = "";
    let lastName = "";
    let phone = "";
    let tableOrAddress = "";
    if (apiOrder.orderType === "dinein" && apiOrder.dineInDetails) {
      firstName = apiOrder.dineInDetails.firstName || "Walk-in";
      lastName = apiOrder.dineInDetails.lastName || "Customer";
      phone = apiOrder.dineInDetails.phone || "";
      tableOrAddress =
        apiOrder.dineInDetails.tableNumber || "Table Not Assigned";
    } else if (apiOrder.deliveryDetails) {
      firstName = apiOrder.deliveryDetails.firstName || "Walk-in";
      lastName = apiOrder.deliveryDetails.lastName || "Customer";
      phone = apiOrder.deliveryDetails.phone || "";
      tableOrAddress = `${apiOrder.deliveryDetails.hostel}, Room ${apiOrder.deliveryDetails.roomNumber}, Floor ${apiOrder.deliveryDetails.floor}`;
    }
    return {
      id: apiOrder._id,
      firstName,
      lastName,
      phone,
      type: apiOrder.orderType as "delivery" | "dinein",
      tableOrAddress,
      status: apiOrder.status.toLowerCase(),
      payment: {
        amount: apiOrder.grandTotal,
        method: "UPI", // Add appropriate method from API
      },
      date: new Date(apiOrder.createdAt).toLocaleString(),
      items: apiOrder.items?.map((item: any) => ({
        id: item._id,
        name: item.name,
        category: item.category || "Veg",
        quantity: item.quantity,
        price: item.price,
        available: true,
      })),
    };
  };

  // Refresh orders data with filters
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      // Prepare filters based on selected values
      const filters = {
        ...(searchTerm && { search: searchTerm }),
        ...(selectedType !== "All Types" && {
          orderType: selectedType.toLowerCase().replace(" ", "") as
            | "delivery"
            | "dinein",
        }),
        ...(selectedPayment !== "All Payments" && {
          isPaid: selectedPayment === "Paid" ? true : false,
        }),
        ...(selectedStatus !== "All Status" && {
          status: selectedStatus.toLowerCase(),
        }),
      };

      const response = await getAllOrders(currentPage, itemsPerPage, filters);
      // Access the data array inside the result object
      const orderItems = response.result.data || [];
      setOrders(orderItems.map(transformApiResponse));
      // Update status counts from API
      setStatusCounts(response.result.statusCounts);
      // Update pagination
      setTotalPages(response.result.totalPages);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to refresh orders:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch orders"
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle view order details
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  // Handle edit order
  const handleEditOrder = (order: Order) => {
    setSelectedEditOrder(order);
    setIsEditModalOpen(true);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEditOrder(null);
  };

  // Handle save edited order
  const handleSaveOrder = (updatedOrder: Order) => {
    // In a real application, you would update the order in your state/database
    console.log("Updated order:", updatedOrder);
    // For demo purposes, we'll just log the updated order
  };

  // Use status counts from API
  const totalOrders = statusCounts.totalOrder;
  const pendingCount = statusCounts.pending;
  const readyCount = statusCounts.ready;
  const deliveredCount = statusCounts.delivered;

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "ready":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "delivered":
        return <TruckIcon className="h-5 w-5 text-blue-500" />;
      case "cancelled":
        return <TrashIcon className="h-5 w-5 text-red-500" />;
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Order Management
            </h1>
            <p className="text-gray-600">
              Track and manage all customer orders in real-time
            </p>
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

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search orders by ID, customer, or table/address..."
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option>All Status</option>
              <option>pending</option>
              <option>ready</option>
              <option>delivered</option>
              <option>cancelled</option>
            </select> */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option>All Types</option>
              <option>dine in</option>
              <option>delivery</option>
            </select>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option>All Payments</option>
              <option>Paid</option>
              <option>Unpaid</option>
            </select>

            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border-2 border-gray-200 ">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Orders
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {totalOrders}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border-2 border-gray-200 ">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendingCount}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl  border-2 border-gray-200 ">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Ready</h3>
                <p className="text-2xl font-bold text-green-600">
                  {readyCount}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl  border-2 border-gray-200 ">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Delivered</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {deliveredCount}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <TruckIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border-2 border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Orders ({filteredOrders.length})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Order ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Table/Address
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <p className="text-gray-500">
                        No orders found matching your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ShoppingBagIcon className="flex-shrink-0 h-5 w-5 text-indigo-500 mr-2" />
                          <span className="font-medium text-gray-900">
                            {order.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.firstName} {order.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.email || order.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.type === "dinein"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {order.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.tableOrAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(order.status)}
                          <span
                            className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{order.payment.amount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 cursor-pointer"
                            title="View Order"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50 cursor-pointer"
                            title="Edit Order"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 cursor-pointer"
                            title="Delete Order"
                            onClick={() => handleDeleteOrderClick(order.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          {/* Delete Confirmation Modal */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Order"
          message="Are you sure you want to delete this order."
          confirmText={deleteLoading ? "Deleting..." : "Delete"}
          cancelText="Cancel"
          type="danger"
        />

        {/* Pagination */}
        <Stack spacing={2} className="flex flex-col items-center mt-4">
          {/* Default view for smaller screens */}
          <div className="block sm:hidden">
            <Pagination
              page={currentPage}
              count={totalPages}
              onChange={(_, newPage) => setCurrentPage(newPage)}
              siblingCount={0}
              boundaryCount={1}
              color="primary"
              size="small"
            />
          </div>
          {/* Enhanced view for larger screens */}
          <div className="hidden sm:block">
            <Pagination
              page={currentPage}
              count={totalPages}
              onChange={(_, newPage) => setCurrentPage(newPage)}
              siblingCount={1}
              boundaryCount={2}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
            />
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Page {currentPage} of {totalPages}
          </div>
        </Stack>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          orderId={selectedOrder.id}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Edit Order Modal */}
      {selectedEditOrder && (
        <EditOrderModal
          orderId={selectedEditOrder.id}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveOrder}
        />
      )}
    </div>
  );
};

export default OrderManagement;
