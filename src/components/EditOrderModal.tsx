"use client";

import React, { useState } from "react";
import {
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

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
  status: "pending" | "ready" | "delivered";
  payment: {
    amount: number;
    method: "UPI" | "Card" | "Wallet";
  };
  date: string;
  items?: OrderItem[];
};

import { getOrderById, updateOrder } from "@/api/Order/page";

type EditOrderProps = {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOrder: Order) => void;
};

const EditOrderModal: React.FC<EditOrderProps> = ({
  orderId,
  isOpen,
  onClose,
  onSave,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<Order["status"]>("pending");
  const [tableOrAddress, setTableOrAddress] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  React.useEffect(() => {
    const fetchOrder = async () => {
      if (!isOpen || !orderId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getOrderById(orderId);
        // Support both result.data[0] (array) and result (object)
        let apiOrder = undefined;
        if (
          response.result &&
          Array.isArray(response.result.data) &&
          response.result.data.length > 0
        ) {
          apiOrder = response.result.data[0];
        } else if (
          response.result &&
          !("page" in response.result) &&
          (response.result as any)._id
        ) {
          // Only use result directly if it is a single order object, not paginated
          apiOrder = response.result;
        }
        if (!apiOrder) {
          setError("Order not found or API returned no data.");
          setOrder(null);
          setLoading(false);
          return;
        }
        const address = apiOrder.deliveryDetails
          ? `${apiOrder.deliveryDetails.hostel}, Room ${apiOrder.deliveryDetails.roomNumber}, Floor ${apiOrder.deliveryDetails.floor}`
          : "";
        const statusValue = ["pending", "ready", "delivered"].includes(
          apiOrder.status.toLowerCase()
        )
          ? (apiOrder.status.toLowerCase() as "pending" | "ready" | "delivered")
          : "pending";
        const transformedOrder: Order = {
          id: apiOrder._id,
          firstName: apiOrder.deliveryDetails?.firstName || "Walk-in",
          lastName: apiOrder.deliveryDetails?.lastName || "Customer",
          phone: apiOrder.deliveryDetails?.phone || "",
          email: "",
          type: apiOrder.orderType as "dinein" | "delivery",
          tableOrAddress: address || "Table Not Assigned",
          status: statusValue,
          payment: {
            amount: apiOrder.totalAmount,
            method: "UPI",
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
        setOrder(transformedOrder);
        setStatus(transformedOrder.status);
        setTableOrAddress(transformedOrder.tableOrAddress);
        setItems(transformedOrder.items || []);
      } catch (err) {
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, isOpen]);

  const handleSave = async () => {
    if (!order) return;
    setLoading(true);
    setError(null);
    try {
      const updatedOrder = {
        ...order,
        status,
        tableOrAddress,
      };
      await updateOrder(order.id, {
        status,
        ...(order.type === "dinein"
          ? { tableNumber: tableOrAddress }
          : { deliveryAddress: tableOrAddress }),
      });
      onSave(updatedOrder);
      onClose();
      window.location.reload();
    } catch (err) {
      setError("Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case "pending":
        return <ClockIcon className="h-4 w-4 text-amber-500" />;
      case "ready":
        return <CheckCircleIcon className="h-4 w-4 text-emerald-500" />;
      case "delivered":
        return <TruckIcon className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }
  if (!order) return null;

  // Compose order details message for WhatsApp
  const getOrderDetailsMessage = () => {
    let msg = `Order Details\n`;
    msg += `Order ID: ${order.id}\n`;
    msg += `Customer: ${order.firstName} ${order.lastName}\n`;
    if (order.phone) msg += `Phone: ${order.phone}\n`;
    msg += `${order.type === "dinein" ? "Table Number" : "Delivery Address"}: ${
      order.tableOrAddress
    }\n`;
    msg += `Status: ${order.status}\n`;
    msg += `\nItems:\n`;
    order.items?.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.name} (${item.category}) x${
        item.quantity
      } - ₹${item.price * item.quantity}\n`;
    });
    msg += `\nTotal: ₹${order.payment.amount}`;
    return msg;
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCopyAndWhatsApp = () => {
    const msg = getOrderDetailsMessage();
    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg);
    }
    // Open WhatsApp Web with message (no phone number, just message)
    const encodedMsg = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encodedMsg}`, "_blank");
    setShowShareModal(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Edit Order - #{order.id}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-full p-1 cursor-pointer"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Status Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="pending">Pending</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Table Number / Address Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {order.type === "dinein" ? "Table Number" : "Delivery Address"}
              </label>
              <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                {tableOrAddress}
              </div>
            </div>

            {/* Items Availability Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Items Availability
              </h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <span
                          className={`w-5 h-5 text-xs font-bold text-white rounded flex items-center justify-center ${
                            item.category === "Veg"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        >
                          {item.category === "Veg" ? "V" : "N"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} • ₹{item.price * item.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share Button for Ready Status */}
            {status === "ready" && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleShare}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors cursor-pointer"
                >
                  Share Order Details
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors cursor-pointer"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 relative">
            {/* Header with WhatsApp branding */}
            <div className="bg-[#00c548] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6 text-white"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="text-white text-lg font-semibold tracking-tight">
                  Share via WhatsApp
                </span>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-white/90 hover:text-white transition-colors rounded-full p-1 hover:bg-white/20 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Content area */}
            <div className="p-6 flex flex-col gap-5">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-inner">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-[#00c548] p-2 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4 text-white"
                    >
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">
                    This will copy the order details and open WhatsApp to share
                    it.
                  </p>
                </div>
                <textarea
                  className="w-full h-32 p-3 border border-gray-200 rounded bg-white text-sm text-gray-700 font-sans resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366]"
                  value={getOrderDetailsMessage()}
                  readOnly
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyAndWhatsApp}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#00c548] rounded-lg hover:bg-[#128C7E] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4 text-white"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>Copy and Share Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditOrderModal;
