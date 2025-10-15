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
  orderId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  type: "dinein" | "delivery";
  tableOrAddress: string;
  status: "pending" | "ready" | "completed" | "cancel";
  deliveryBoyId?: string;
  deliveryBoyName?: string;
  payment: {
    amount: number;
    method: "UPI" | "Card" | "Wallet";
  };
  isPaid: boolean;
  paymentStatus: "SUCCESS" | "PENDING" | "FAILED";
  date: string;
  items?: OrderItem[];
  totalAmount?: number;
  deliveryCharges?: number;
  grandTotal?: number;
};

import { getOrderById, updateOrder } from "@/api/Order/page";
import { getAllDeliveryBoys, DeliveryBoy } from "@/api/DeliveryBoy/page";

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
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [selectedDeliveryBoyId, setSelectedDeliveryBoyId] = useState<string>("");

  // Fetch delivery boys when modal opens
  React.useEffect(() => {
    const fetchDeliveryBoys = async () => {
      if (!isOpen) return;
      try {
        const response = await getAllDeliveryBoys(1, 100); // Get all active delivery boys
        setDeliveryBoys(response.result.data);
      } catch (err) {
        console.error("Failed to fetch delivery boys:", err);
      }
    };
    fetchDeliveryBoys();
  }, [isOpen]);

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
        
        // Handle both dineInDetails and deliveryDetails
        let address = "";
        let firstName = "Walk-in";
        let lastName = "Customer";
        let phone = "";
        
        if (apiOrder.orderType === "dinein" && apiOrder.dineInDetails) {
          address = `Table ${apiOrder.dineInDetails.tableNumber}`;
          firstName = apiOrder.dineInDetails.firstName || "Walk-in";
          lastName = apiOrder.dineInDetails.lastName || "Customer";
          phone = apiOrder.dineInDetails.phone || "";
        } else if (apiOrder.orderType === "delivery" && apiOrder.deliveryDetails) {
          address = `${apiOrder.deliveryDetails.hostel}, Room ${apiOrder.deliveryDetails.roomNumber}, Floor ${apiOrder.deliveryDetails.floor}`;
          firstName = apiOrder.deliveryDetails.firstName || "Walk-in";
          lastName = apiOrder.deliveryDetails.lastName || "Customer";
          phone = apiOrder.deliveryDetails.phone || "";
        } else {
          address = "Address Not Available";
        }
        
        const statusValue = ["pending", "ready", "completed", "cancel"].includes(
          apiOrder.status.toLowerCase()
        )
          ? (apiOrder.status.toLowerCase() as "pending" | "ready" | "completed" | "cancel")
          : "pending";
        const transformedOrder: Order = {
          id: apiOrder._id,
          orderId: apiOrder.orderId, // Extract orderId from API response
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          email: "",
          type: apiOrder.orderType as "dinein" | "delivery",
          tableOrAddress: address,
          status: statusValue,
          deliveryBoyId: (apiOrder as any).deliveryBoy || "", // Extract delivery boy ID
          deliveryBoyName: (apiOrder as any).deliveryBoyName || "",
          payment: {
            amount: apiOrder.totalAmount,
            method: "UPI",
          },
          isPaid: apiOrder.isPaid || false,
          paymentStatus: (apiOrder as any).paymentStatus || (apiOrder.isPaid ? "SUCCESS" : "PENDING"),
          date: new Date(apiOrder.createdAt).toLocaleString(),
          items: apiOrder.items?.map((item: any) => ({
            id: item._id,
            name: item.name,
            category: item.category || "Veg",
            quantity: item.quantity,
            price: item.price,
            available: true,
          })),
          totalAmount: apiOrder.totalAmount,
          deliveryCharges: apiOrder.deliveryCharges || 0,
          grandTotal: apiOrder.grandTotal,
        };
        setOrder(transformedOrder);
        setStatus(transformedOrder.status);
        setTableOrAddress(transformedOrder.tableOrAddress);
        setSelectedDeliveryBoyId((apiOrder as any).deliveryBoy || ""); // Set the delivery boy ID from API
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
      const selectedDeliveryBoy = deliveryBoys.find(boy => boy._id === selectedDeliveryBoyId);
      const updatedOrder = {
        ...order,
        status,
        tableOrAddress,
        deliveryBoyId: selectedDeliveryBoyId,
        deliveryBoyName: selectedDeliveryBoy?.name || "",
      };
      
      // Prepare update payload
      const updatePayload: any = {
        status,
        email: selectedDeliveryBoy?.email || "",
      };
      
      // Add address field based on order type
      if (order.type === "dinein") {
        updatePayload.tableNumber = tableOrAddress;
      } else {
        updatePayload.deliveryAddress = tableOrAddress;
      }
      
      await updateOrder(order.id, updatePayload);
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
      case "completed":
        return <TruckIcon className="h-4 w-4 text-blue-500" />;
      case "cancel":
        return <XMarkIcon className="h-4 w-4 text-red-500" />;
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
    msg += `Order ID: ${order.orderId || order.id}\n`;
    msg += `Customer: ${order.firstName} ${order.lastName}\n`;
    if (order.phone) msg += `Phone: ${order.phone}\n`;
    msg += `${order.type === "dinein" ? "Table Number" : "Delivery Address"}: ${
      order.tableOrAddress
    }\n`;
    msg += `Status: ${order.status === "completed" 
      ? (order.type === "dinein" ? "Delivery" : "Out for Delivery") 
      : order.status}\n`;
    msg += `\nItems:\n`;
    order.items?.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.name} (${item.category}) x${
        item.quantity
      } - ₹${item.price * item.quantity}\n`;
    });
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

  // Print invoice with custom billing design
  const handlePrint = () => {
    if (typeof window === "undefined") return;

    const printWindow = window.open("", "", "width=900,height=700");
    if (!printWindow) return;

    const invoiceHTML = `
      <!doctype html>
      <html>
        <head>
          <title>Invoice - ${order.orderId || order.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', 'Helvetica', sans-serif; 
              background: #fff; 
              color: #000; 
              line-height: 1.4;
              padding: 5px;
              font-size: 13px;
              font-weight: 500;
            }
            .receipt { 
              max-width: 300px; 
              margin: 0 auto; 
              background: white;
            }
            .center { text-align: center; }
            .left { text-align: left; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .line { 
              border-bottom: 1px dashed #000; 
              margin: 8px 0; 
            }
            .double-line { 
              border-bottom: 2px solid #000; 
              margin: 8px 0; 
            }
            .header { 
              text-align: center; 
              margin-bottom: 12px; 
            }
            .header h1 { 
              font-size: 18px; 
              font-weight: bold; 
              margin: 3px 0; 
              color: #000;
              letter-spacing: 0.5px;
            }
            .header h2 { 
              font-size: 15px; 
              margin: 2px 0; 
              color: #000;
              font-weight: 600;
            }
            .header p { 
              font-size: 11px; 
              margin: 1px 0; 
              color: #000;
              font-weight: 500;
            }
            .order-details { 
              margin: 12px 0; 
              font-size: 12px;
              color: #000;
              font-weight: 500;
            }
            .item-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 3px 0;
              font-size: 12px;
              color: #000;
              font-weight: 500;
            }
            .item-name { 
              flex: 1; 
              text-align: left; 
              color: #000;
              font-weight: 600;
            }
            .item-qty-price { 
              text-align: right; 
              min-width: 80px;
              color: #000;
              font-weight: 600;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 4px 0;
              font-size: 12px;
              color: #000;
              font-weight: 600;
            }
            .grand-total { 
              font-weight: bold; 
              font-size: 14px;
              border-top: 2px solid #000;
              padding-top: 6px;
              margin-top: 6px;
              color: #000;
            }
            .footer { 
              text-align: center; 
              margin-top: 15px; 
              font-size: 10px;
              color: #000;
              font-weight: 600;
            }
            .spacer { margin: 6px 0; }
            @media print {
              body { padding: 2px; }
              .receipt { max-width: 100%; }
              * { color: #000 !important; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <!-- Header -->
            <div class="header">
              <h1>NESTLE CORNER-2</h1>
              <p>L-Gate, IIT, Argul, Jatni, 752050</p>
              <p>Mobile: +91 7008203600</p>
              <p>GST: 21AADCL9940L1ZA</p>
              <p>FSSAI: 12022019000036</p>
            </div>
            
            <div class="double-line"></div>
            
            <!-- Order Details -->
            <div class="order-details">
              <div style="display: flex; justify-content: space-between;">
                <span>Bill No: ${order.orderId || order.id}</span>
                <span>${new Date(order.date).toLocaleDateString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Time: ${new Date(order.date).toLocaleTimeString()}</span>
                <span>${order.type === "dinein" ? "DINE-IN" : "DELIVERY"}</span>
              </div>
              <div class="spacer"></div>
              <div style="color: #000; font-weight: 600;">Customer: ${order.firstName} ${order.lastName}</div>
              ${order.phone ? `<div style="color: #000; font-weight: 600;">Phone: ${order.phone}</div>` : ''}
              <div style="color: #000; font-weight: 600;">${order.type === "dinein" ? "Table" : "Address"}: ${order.tableOrAddress}</div>
            </div>
            
            <div class="line"></div>
            
            <!-- Items -->
            <div>
              ${order.items?.map((item, index) => `
                <div class="item-row">
                  <div class="item-name">
                    ${item.name}${item.category === "Veg" ? " (V)" : " (NV)"}
                  </div>
                </div>
                <div class="item-row">
                  <div>${item.quantity} x ₹${item.price.toFixed(2)}</div>
                  <div class="item-qty-price">₹${(item.price * item.quantity).toFixed(2)}</div>
                </div>
                <div class="spacer"></div>
              `).join('') || ''}
            </div>
            
            <div class="line"></div>
            
            <!-- Totals -->
            <div>
              <div class="total-row">
                <span>Subtotal:</span>
                <span>₹${(order.totalAmount || order.payment.amount).toFixed(2)}</span>
              </div>
              ${order.type === "delivery" ? `
                <div class="total-row">
                  <span>Packaging:</span>
                  <span>₹${(() => {
                    const grandTotal = order.grandTotal || 0;
                    const totalAmount = order.totalAmount || order.payment.amount;
                    const deliveryCharges = order.deliveryCharges || 0;
                    const packagingCost = grandTotal - (totalAmount + deliveryCharges);
                    return Math.max(0, packagingCost).toFixed(2);
                  })()}</span>
                </div>
                <div class="total-row">
                  <span>Delivery:</span>
                  <span>₹${(order.deliveryCharges || 0).toFixed(2)}</span>
                </div>
              ` : ''}
              
              <div class="total-row grand-total">
                <span>GRAND TOTAL:</span>
                <span>₹${(order.grandTotal || order.payment.amount).toFixed(2)}</span>
              </div>
            </div>
            
            <div class="line"></div>
            
            <!-- Payment Info -->
            <div class="center" style="margin: 10px 0; font-size: 12px; color: #000; font-weight: 600;">
              <div>Payment: ${order.paymentStatus}</div>
              <div>Status: ${order.status === "completed" 
                ? (order.type === "dinein" ? "DELIVERED" : "OUT FOR DELIVERY")
                : order.status.toUpperCase()}</div>
            </div>
            
            <div class="line"></div>
            
            <!-- Footer -->
            <div class="footer">
              <p class="bold">THANK YOU FOR ORDERING!</p>
              <p>Visit Again</p>
              <div class="spacer"></div>
              <p>***** COMPUTER GENERATED BILL *****</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  // Download modal content as a standalone HTML file
  const handleDownload = () => {
    const content = document.getElementById("printable-modal");
    if (!content) return;
    const styleTags = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((el) => (el as HTMLLinkElement | HTMLStyleElement).outerHTML)
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"/>${styleTags}<style>
      @media print { .no-print { display: none !important; } }
      html, body { background: #fff; }
    </style></head><body>${content.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `order-${order?.id || 'details'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div id="printable-modal" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Edit Order - #{order.orderId}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-full p-1 cursor-pointer no-print"
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
                {/* <option value="ready">Ready</option> */}
                <option value="completed">
                  {order?.type === "dinein" ? "Delivered" : "Out for Delivery"}
                </option>
                <option value="cancel">Cancel</option>
              </select>
            </div>

            {/* Delivery Boy Selection - Only for delivery orders */}
            {order?.type === "delivery" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Delivery Boy
                </label>
                <select
                  value={selectedDeliveryBoyId}
                  onChange={(e) => setSelectedDeliveryBoyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                >
                  <option value="">Select Delivery Boy</option>
                  {deliveryBoys
                    .filter(boy => boy.status === "active")
                    .map((boy) => (
                      <option key={boy._id} value={boy._id}>
                        {boy.name} - {boy.phone}
                      </option>
                    ))}
                </select>
                {selectedDeliveryBoyId && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Selected:</span>{" "}
                    {deliveryBoys.find(boy => boy._id === selectedDeliveryBoyId)?.name || "Loading..."}
                  </div>
                )}
              </div>
            )}

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

            
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleShare}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors cursor-pointer"
                >
                  Share Order Details
                </button>
              </div>
          
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 no-print">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Print
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Download
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