"use client";

import React, { useEffect, useState } from "react";
import {
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  PrinterIcon,
  UserCircleIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { getOrderById } from "@/api/Order/page";



interface OrderDetailsProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsProps> = ({ orderId, isOpen, onClose }) => {
  const [detailedOrder, setDetailedOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        const response = await getOrderById(orderId);
        const transformedOrder = transformApiResponse(response.result);
        setDetailedOrder(transformedOrder);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch order details:', error);
        setError('Failed to load order details');
        setDetailedOrder(null);
      } finally {
        setIsLoading(false);
      }
    };
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [orderId, isOpen]);

  // Transform API response to match our Order type
  const transformApiResponse = (apiOrder: any) => {
    let firstName = "";
    let lastName = "";
    let phone = "";
    let tableOrAddress = "";
    if (apiOrder.orderType === "dinein" && apiOrder.dineInDetails) {
      firstName = apiOrder.dineInDetails.firstName || "Walk-in";
      lastName = apiOrder.dineInDetails.lastName || "Customer";
      phone = apiOrder.dineInDetails.phone || "";
      tableOrAddress = apiOrder.dineInDetails.tableNumber || "Table Not Assigned";
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
      type: apiOrder.orderType as "dinein" | "delivery",
      tableOrAddress,
      status: apiOrder.status.toLowerCase(),
      payment: {
        amount: apiOrder.grandTotal,
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


  if (!isOpen) return null;
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }
  if (!detailedOrder) return null;

  // Get customer name
  const customerName = `${detailedOrder.firstName} ${detailedOrder.lastName}`;
  const customerContact = detailedOrder.phone || "No contact info";



  const getStatusIcon = () => {
    switch (detailedOrder.status) {
      case "pending":
        return <ClockIcon className="h-5 w-5 text-amber-500" />;
      case "ready":
        return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
      case "delivered":
        return <TruckIcon className="h-5 w-5 text-blue-500" />;
      case "cancelled":
        return <XMarkIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (detailedOrder.status) {
      case "pending":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "ready":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "delivered":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-red-200 text-red-800 border-red-200";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4  flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Order #{detailedOrder.id}
            </h2>
            <div
              className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()} border`}
            >
              {getStatusIcon()}
              <span className="ml-1 capitalize">{detailedOrder.status}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors cursor-pointer hover:bg-white/10 rounded-full p-1 "
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Customer and Order Summary - Stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-5 border border-gray-200 sm:flex-1">
              <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <UserCircleIcon className="h-5 w-5 mr-2 text-gray-600" />
                Customer Details
              </h3>
              <div className="grid grid-cols-1 sm:gap-2.5">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">NAME</p>
                  <p className="text-gray-900 font-medium text-sm">
                    {customerName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">CONTACT</p>
                  <p className="text-gray-900 font-medium text-sm">
                    {customerContact}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-5 border border-gray-200 sm:flex-1">
              <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-gray-600" />
                Order Summary
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">
                    ORDER TYPE
                  </p>
                  <p className="text-gray-900 font-medium capitalize text-sm">
                    {detailedOrder.type}
                  </p>
                </div>

             

                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">
                    DATE & TIME
                  </p>
                  <p className="text-gray-900 font-medium text-sm">
                    {detailedOrder.date}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 sm:p-5 border border-gray-200 sm:flex-1">
            <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
              <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-gray-600" />
              {detailedOrder.type === "delivery" ? "Delivery Details" : "Dine-in Details"}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {detailedOrder.type === "delivery" ? (
                <>
                  <p className="text-xs font-medium text-gray-500">
                    DELIVERY ADDRESS: <span className="font-bold text-sm text-zinc-950">{detailedOrder.tableOrAddress}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-gray-500">
                    TABLE NUMBER: <span className="font-bold text-sm text-zinc-950">{detailedOrder.tableOrAddress}</span>
                  </p>
                  <p className="text-xs font-medium text-gray-500">
                    CUSTOMER NAME: <span className="font-bold text-sm text-zinc-950">{detailedOrder.firstName} {detailedOrder.lastName}</span>
                  </p>
                  <p className="text-xs font-medium text-gray-500">
                    PHONE: <span className="font-bold text-sm text-zinc-950">{detailedOrder.phone}</span>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
              Order Items
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {detailedOrder.items && detailedOrder.items.length > 0 ? (
                detailedOrder.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-200 transition-colors"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate text-xs sm:text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
                        <span
                          className={`w-2 h-2 rounded-full ring-2 ${
                            item.category === "Veg"
                              ? "bg-emerald-500 ring-emerald-200"
                              : "bg-rose-500 ring-rose-200"
                          }`}
                        />
                        <span className="text-[10px] font-medium tracking-wide capitalize">
                          {item.category.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900 whitespace-nowrap ml-2">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No items found for this order.</p>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="bg-orange-50 rounded-lg p-4 sm:p-5 border border-orange-100">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-semibold text-orange-900">
                Total Amount
              </h3>
              <p className="text-lg sm:text-2xl font-bold text-orange-900">
                ₹{detailedOrder.payment.amount}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        {/* <div className="flex justify-between items-center p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
          >
            Close
          </button>
          <button className="px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors flex items-center">
            <PrinterIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Print Receipt</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default OrderDetailsModal;
