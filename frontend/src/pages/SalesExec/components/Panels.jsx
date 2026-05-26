import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  ShieldCheck,
  Plus,
  X,
  Upload,
  Printer,
  IndianRupee,
  AlertCircle,
  FileText,
  MessageCircle,
  Image,
  Link,
  Quote,
  User,
  Phone,
  Eye,
  ShoppingBag,
} from "lucide-react";
import { requirementTypes } from "../data/mockData";

import { useAuth } from "../../../context/AuthContext";
import { appointmentApi, orderApi, productApi } from "../../../services/api";
import { ProductCatalogueModal } from "./ProductCatalogueModal";

// ─── Appointment Hub ──────────────────────────────────────────────────────────
export const AppointmentHub = ({ appointments = [], onSchedule }) => (
  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
    <div className="flex items-center justify-between p-5 border-b">
      <div>
        <h3 className="font-bold text-base">📅 Appointment Hub</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {appointments.length} upcoming meetings
        </p>
      </div>
      <button
        onClick={onSchedule}
        className="h-8 px-3 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5"
        style={{ background: "#7c3aed" }}
      >
        <Plus className="h-3.5 w-3.5" /> Schedule
      </button>
    </div>
    {appointments.length === 0 ? (
      <div className="p-8 text-center text-muted-foreground text-sm">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
        No appointments scheduled
      </div>
    ) : (
      <div className="divide-y divide-border">
        {appointments.map((apt, i) => (
          <div
            key={apt._id || i}
            className="flex items-start gap-4 p-4 hover:bg-purple-50/30 transition-colors"
          >
            <div
              className="h-10 w-10 rounded-xl flex flex-col items-center justify-center shrink-0 text-white font-bold text-xs"
              style={{ background: "#7c3aed" }}
            >
              <span>
                {apt.date === "Today"
                  ? "NOW"
                  : (apt.date || "").replace("Apr ", "")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">
                  {apt.client || apt.prospect?.name}
                </span>
                {apt.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5">
                    <ShieldCheck className="h-3 w-3" /> Manager Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {apt.company || apt.prospect?.company}
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {apt.time}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {apt.location}
                </span>
              </div>
              <span className="inline-block mt-1.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold px-2 py-0.5">
                {apt.purpose}
              </span>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button className="h-7 px-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
                Confirm
              </button>
              <button className="h-7 px-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
                Reschedule
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Order List ───────────────────────────────────────────────────────────────
export const OrderList = ({
  orders = [],
  onCreateOrder,
  onUploadPayment,
  onViewDetails,
  onLineItemUpdated,
  compact,
  hideCompleted,
}) => {
  const { user } = useAuth();
  const [updatingLineItem, setUpdatingLineItem] = useState(null);
  const [verificationTab, setVerificationTab] = useState('All');
  const isVerifier = ['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'ACCOUNTS'].includes(user?.role);
  const pendingVerificationCount = (orders || []).filter(o => o.verificationStatus === 'Pending').length;

  const statusColors = {
    Confirmed: "bg-blue-100 text-blue-700",
    "In Production": "bg-amber-100 text-amber-700",
    "Design Review": "bg-purple-100 text-purple-700",
    Completed: "bg-green-100 text-green-700",
  };
  const paymentColors = {
    Partial: "bg-orange-100 text-orange-700",
    Paid: "bg-green-100 text-green-700",
    Pending: "bg-red-100 text-red-700",
  };

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All Months");
  const months = [
    "All Months",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const filteredOrders = (orders || []).filter((o) => {
    // Hide Pending_Approval orders from general lists for Sales Execs
    const isSalesExec = ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC'].includes(user?.role);
    if (isSalesExec && o.status === 'Pending_Approval') return false;

    const matchSearch =
      !search ||
      [o.orderNumber, o.id, o.clientSnapshot?.name, o.client].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    const matchPayment =
      paymentFilter === "All" || o.paymentStatus === paymentFilter;
    let matchMonth = true;
    if (monthFilter !== "All Months") {
      const oMonth = new Date(
        o.createdAt || o.date || new Date(),
      ).toLocaleString("default", { month: "long" });
      matchMonth = oMonth === monthFilter;
    }
    const matchHide = hideCompleted
      ? !["Completed", "Cancelled"].includes(o.status)
      : true;
    const matchVerification = verificationTab === 'All' || o.verificationStatus === 'Pending';
    return (
      matchSearch && matchStatus && matchPayment && matchMonth && matchHide && matchVerification
    );
  });

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      {!compact && (
        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm font-medium text-slate-700">
                Year:
              </label>
              <select className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]">
                <option>All Years</option>
                <option>2026</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm font-medium text-slate-700">
                Month:
              </label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm font-medium text-slate-700">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]"
              >
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Production">In Production</option>
                <option value="Design Review">Design Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm font-medium text-slate-700">
                Payment:
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]"
              >
                <option value="All">All Payments</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, client name..."
              className="h-12 w-full rounded-full border border-slate-300 px-6 text-sm outline-none focus:border-[#003366]"
            />
          </div>

          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90"
              style={{ background: "#4caf50" }}
            >
              <FileText className="h-4 w-4" /> Export to Excel
            </button>
            <button
              className="flex items-center gap-2 h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90"
              style={{ background: "#00acc1" }}
            >
              <Printer className="h-4 w-4" /> Print Report
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b gap-4">
          <div>
            <h3 className="font-bold text-base">🧾 My Orders</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredOrders.length} active orders
            </p>
          </div>
          {isVerifier && !compact && (
            <div className="flex p-1 bg-slate-100 rounded-xl w-fit shrink-0">
              <button
                type="button"
                onClick={() => setVerificationTab('All')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${verificationTab === 'All' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                All Orders
              </button>
              <button
                type="button"
                onClick={() => setVerificationTab('Pending')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${verificationTab === 'Pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Pending Verification
                {pendingVerificationCount > 0 && (
                  <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none">
                    {pendingVerificationCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No orders match your filters
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredOrders.map((order, i) => (
              <div
                key={order._id || order.id || i}
                className="p-4 hover:bg-green-50/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-bold text-sm text-blue-700">
                        {order.orderNumber || order.id}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${paymentColors[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}
                      >
                        {order.paymentStatus} Payment
                      </span>
                      {/* Payment Verification Pending badge */}
                      {(order.paymentRecords || []).some(p => p.status === 'Pending') && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                          💰 Payment Verification Pending
                        </span>
                      )}
                      {order.verificationStatus === 'Pending' && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                          ⏳ Order Verification Pending
                        </span>
                      )}
                      {order.verificationStatus === 'Verified' && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          🛡 Order Verified by {order.verifiedByName || 'Manager'} ({order.verifiedByRole?.replace('_', ' ') || 'Admin'})
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm">
                      {order.clientSnapshot?.name || order.client}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        Total:{" "}
                        <span className="font-bold text-foreground">
                          ₹
                          {order.grandTotal?.toLocaleString("en-IN") ||
                            order.amount}
                        </span>
                      </span>
                      {/* Show Paid/Balance only when payments verified (no pending payment records) */}
                      {(order.paymentRecords || []).some(p => p.status === 'Pending') ? (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          💰 Advance payment awaiting verification
                        </span>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground">
                            Paid:{" "}
                            <span className="font-semibold text-emerald-600">
                              ₹
                              {order.totalPaid?.toLocaleString("en-IN") || '0'}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Balance:{" "}
                            <span className="font-bold text-red-500">
                              ₹
                              {(
                                (order.grandTotal || 0) - (order.totalPaid || 0)
                              ).toLocaleString("en-IN")}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div
                      className={`rounded-xl px-3 py-1.5 text-center ${order.designStatus === "Approved" || order.designStatus === "Completed" ? "bg-green-100 border border-green-200" : "bg-amber-50 border border-amber-200"}`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Design
                      </p>
                      <p
                        className={`text-xs font-bold mt-0.5 ${order.designStatus === "Approved" ? "text-green-700" : "text-amber-700"}`}
                      >
                        {order.designStatus === "Approved"
                          ? "✅ Ready for Print"
                          : "🎨 " + (order.designStatus || "Pending")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 items-center">
                  <button
                    onClick={() => onUploadPayment?.(order)}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Upload className="h-3 w-3" /> Upload Payment
                  </button>
                  <button
                    onClick={() => onViewDetails?.(order)}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                  >
                    <FileText className="h-3 w-3" /> View Details
                  </button>
                  {isVerifier && order.verificationStatus === 'Pending' && (
                    <button 
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to verify payments and confirm Order #${order.orderNumber}?`)) {
                          try {
                            const res = await orderApi.verify(order._id || order.id, user.token);
                            if (res.success) {
                              alert('Order verified successfully!');
                              onLineItemUpdated?.();
                            }
                          } catch (err) {
                            alert(err.message || 'Verification failed');
                          }
                        }
                      }} 
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm ml-auto animate-bounce"
                    >
                      🛡 Verify Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Activity Timeline ────────────────────────────────────────────────────────
export const ActivityTimeline = ({ events = [] }) => (
  <div className="rounded-2xl border bg-white shadow-sm p-5">
    <h3 className="font-bold text-base mb-4">⏱ Activity Timeline</h3>
    {events.length === 0 ? (
      <div className="text-center text-muted-foreground text-sm py-6">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
        No recent activity
      </div>
    ) : (
      <div className="space-y-5">
        {events.map((group, gi) => (
          <div key={gi}>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
              {group.label}
            </p>
            <div className="space-y-3 pl-2 border-l-2 border-blue-100">
              {group.events.map((ev, i) => (
                <div key={i} className="flex gap-3 relative">
                  <div className="absolute -left-[17px] top-0.5 h-4 w-4 rounded-full bg-white border-2 border-blue-300 flex items-center justify-center text-[9px]">
                    {ev.icon}
                  </div>
                  <div className="pl-2">
                    <p className="text-sm font-medium">{ev.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ev.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Schedule Appointment Modal ────────────────────────────────────────────────
export const ScheduleAppointmentModal = ({ prospect, onClose, onSaved }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    venue: "",
    executiveRemark: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await appointmentApi.create(
        {
          prospectId: prospect._id || prospect.id,
          date: formData.date,
          time: formData.time,
          venue: formData.venue,
          executiveRemark: formData.executiveRemark,
        },
        user.token,
      );
      if (res.success) {
        onSaved?.();
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to schedule appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div
          className="flex items-center justify-between p-5 border-b shrink-0"
          style={{ background: "linear-gradient(135deg, #4f46e5, #4338ca)" }}
        >
          <div>
            <h2 className="text-white font-bold text-lg">
              📅 Schedule Appointment
            </h2>
            <p className="text-indigo-200 text-xs mt-0.5">
              Assign meeting for {prospect?.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-200 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Executive Name
            </label>
            <input
              value={user?.name || ""}
              readOnly
              className="h-9 w-full rounded-lg border border-input bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Business Name
              </label>
              <input
                value={prospect?.company || ""}
                readOnly
                className="h-9 w-full rounded-lg border border-input bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Contact Person
              </label>
              <input
                value={prospect?.name || ""}
                readOnly
                className="h-9 w-full rounded-lg border border-input bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Phone Number
            </label>
            <input
              value={prospect?.phone || ""}
              readOnly
              className="h-9 w-full rounded-lg border border-input bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Date
              </label>
              <input
                required
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Time
              </label>
              <input
                required
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Venue / Address
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter full address or meeting link..."
              value={formData.venue}
              onChange={(e) =>
                setFormData({ ...formData, venue: e.target.value })
              }
              className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Executive Remark
            </label>
            <textarea
              rows={2}
              placeholder="Enter initial remark or notes..."
              value={formData.executiveRemark}
              onChange={(e) =>
                setFormData({ ...formData, executiveRemark: e.target.value })
              }
              className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 flex-1 rounded-lg border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 flex-1 rounded-lg text-white text-sm font-medium flex justify-center items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-70"
              style={{ background: "#4f46e5" }}
            >
              {loading ? "Scheduling..." : "Schedule Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Order Search Modal ───────────────────────────────────────────────────────
export const OrderSearchModal = ({ onClose, onSearch }) => {
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl overflow-hidden p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-8 text-slate-900">
          Search Client
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">
              10-Digit Mobile Number:
            </label>
            <input
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="Enter mobile number"
              className="h-10 w-full rounded border border-slate-300 bg-background px-3 text-sm outline-none focus:border-[#003366]"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">
              Business Name:
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter business name"
              className="h-10 w-full rounded border border-slate-300 bg-background px-3 text-sm outline-none focus:border-[#003366]"
            />
          </div>
          <button
            onClick={() =>
              onSearch({ phone, company: (company || "").toLowerCase() })
            }
            className="w-full h-10 rounded text-white font-semibold text-sm transition-colors hover:opacity-90"
            style={{ background: "#003366" }}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Order Client Details Modal ───────────────────────────────────────────────
export const OrderClientDetailsModal = ({
  client,
  onBack,
  onCreateOrder,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-8 relative">
        <button
          onClick={onClose || onBack}
          className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">
          Client Details
        </h2>
        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
          {/* Read only fields with light grey background */}
          {[
            {
              label: "Business Name",
              value: client.company || client.businessName,
            },
            {
              label: "Contact Person",
              value: client.name || client.contactPerson,
            },
            { label: "Phone Number", value: client.phone },
            { label: "Location", value: client.location },
            { label: "Client Type", value: client.clientType },
          ].map((field, i) => (
            <div key={i}>
              <label className="text-xs font-bold text-slate-800 mb-1 block">
                {field.label}
              </label>
              <div className="w-full rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 min-h-[36px]">
                {field.value || "-"}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-6 flex justify-center gap-4 shrink-0">
          <button
            onClick={onBack}
            className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:bg-green-600"
            style={{ background: "#4caf50" }}
          >
            Back to Search
          </button>
          <button
            onClick={() => onCreateOrder(client)}
            className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:bg-blue-600"
            style={{ background: "#2196f3" }}
          >
            Create New Order
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Create Order Modal ───────────────────────────────────────────────────────
export const CreateOrderModal = ({
  client,
  executiveName,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    executiveName: executiveName || "",
    orderDate: new Date().toISOString().split("T")[0],
    orderType: client?.clientType || "retail",
    gstNumber: "",
    company: client?.company || client?.businessName || "",
    name: client?.name || client?.contactPerson || "",
    phone: client?.phone || "",
    location: client?.location || client?.requirement?.location || "",
    state: "Telangana",
    pincode: "",
    birthDate: "",
    anniversaryDate: "",
    designStatus: "Design Provided",
  });

  const { user } = useAuth();
  const [availableProducts, setAvailableProducts] = useState([]);
  const [clientTypes, setClientTypes] = useState([]);

  React.useEffect(() => {
    Promise.all([
      productApi.list(user?.token),
      productApi.getClientTypes(user?.token).catch(() => ({ data: [] }))
    ])
      .then(([pRes, ctRes]) => {
        if (pRes.success)
          setAvailableProducts(pRes.data.filter((p) => p.status === "Active"));
        if (ctRes.data)
          setClientTypes(ctRes.data);
      })
      .catch(console.error);
  }, [user]);

  const [items, setItems] = useState([
    {
      productId: "",
      desc: "",
      isCustom: false,
      customDesc: "",
      qty: 1,
      cost: 0,
      deliveryDate: "",
    },
  ]);
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [advance, setAdvance] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentProof, setPaymentProof] = useState(null);
  const [applyGst, setApplyGst] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [errors, setErrors] = useState({});
  const [designFile, setDesignFile] = useState(null);

  const getProductPriceForOrderType = (product, orderType) => {
    if (!product) return 0;
    if (!orderType) return product.pricingRules?.sellingPrice || product.pricingRules?.totalBasePrice || product.basePrice || 0;
    
    if (product.clientTypePricing) {
      if (product.clientTypePricing[orderType] !== undefined) {
        return product.clientTypePricing[orderType];
      }
      const matchKey = Object.keys(product.clientTypePricing).find(
        k => k.toLowerCase() === orderType.toLowerCase()
      );
      if (matchKey && product.clientTypePricing[matchKey] !== undefined) {
        return product.clientTypePricing[matchKey];
      }
    }
    return product.pricingRules?.sellingPrice || product.pricingRules?.totalBasePrice || product.basePrice || 0;
  };

  const handleSelectFromCatalogue = (product) => {
    const price = getProductPriceForOrderType(product, formData.orderType);
    const desc = product.productName || product.name;
    const moq = product.minimumOrderQuantity || 1;

    if (activeItemIndex !== null) {
      setItems((prev) =>
        prev.map((item, idx) => {
          if (idx === activeItemIndex) {
            return {
              ...item,
              productId: product._id,
              desc: desc,
              cost: price,
              qty: Math.max(item.qty, moq),
              isCustom: false,
            };
          }
          return item;
        }),
      );
    } else {
      const newItem = {
        productId: product._id,
        desc: desc,
        isCustom: false,
        customDesc: "",
        qty: moq,
        cost: price,
        deliveryDate: "",
      };
      if (
        items.length === 1 &&
        !items[0].productId &&
        !items[0].desc &&
        items[0].cost === 0
      ) {
        setItems([newItem]);
      } else {
        setItems((prev) => [...prev, newItem]);
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.orderType) newErrors.orderType = "Required";
    if (!formData.company) newErrors.company = "Required";
    if (!formData.name) newErrors.name = "Required";
    if (!formData.phone) newErrors.phone = "Required";
    else if (formData.phone.length !== 10) newErrors.phone = "Enter 10 digits";

    if (!formData.location) newErrors.location = "Required";
    if (!formData.state) newErrors.state = "Required";
    if (!formData.pincode) newErrors.pincode = "Required";
    else if (formData.pincode.length !== 6)
      newErrors.pincode = "Enter 6 digits";

    if (!advance || Number(advance) <= 0) {
      newErrors.advance = "Required";
    } else if (Number(advance) > totalAmount) {
      newErrors.advance = "You enter more then Final Amount";
    }
    if (!paymentProof) newErrors.paymentProof = "Required";
    if (formData.designStatus === "Design Provided" && !designFile) {
      newErrors.designFile = "Required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const states = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Other",
  ];

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        desc: "",
        isCustom: false,
        customDesc: "",
        qty: 1,
        cost: 0,
        deliveryDate: "",
      },
    ]);
  const removeItem = (i) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, k, v) =>
    setItems((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [k]: v } : item)),
    );

  const handleProductSelect = (i, productId) => {
    const product = availableProducts.find((p) => p._id === productId);
    if (!product) return;
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === i) {
          return {
            ...item,
            productId,
            desc: product.productName || product.name,
            cost: getProductPriceForOrderType(product, formData.orderType),
            isCustom: false,
          };
        }
        return item;
      }),
    );
  };

  // Calculations
  const rawSubtotal = items.reduce(
    (s, item) => s + item.qty * Number(item.cost || 0),
    0,
  );
  const discountAmount = rawSubtotal * (Number(discount) / 100);
  const taxableAmount = rawSubtotal - discountAmount;

  // GST Logic: If GST start with "36" (Telangana code) or if state is Telangana, show CGST/SGST.
  // Otherwise show IGST. This is a simplified demo logic.
  const isInterState = formData.state !== "Telangana";
  const cgst = applyGst && !isInterState ? taxableAmount * 0.09 : 0;
  const sgst = applyGst && !isInterState ? taxableAmount * 0.09 : 0;
  const igst = applyGst && isInterState ? taxableAmount * 0.18 : 0;
  const totalAmount = taxableAmount + cgst + sgst + igst;

  const advancePct =
    totalAmount > 0 ? (Number(advance) / totalAmount) * 100 : 0;
  const advanceLow = totalAmount > 0 && advancePct < 50 && advance !== "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "phone" || name === "pincode") {
      finalValue = value.replace(/\D/g, "").slice(0, name === "phone" ? 10 : 6);
    } else if (name === "name") {
      finalValue = value.replace(/[^a-zA-Z\s]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));

    if (name === "orderType") {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (!item.productId || item.isCustom) return item;
          const product = availableProducts.find((p) => p._id === item.productId);
          if (!product) return item;
          return {
            ...item,
            cost: getProductPriceForOrderType(product, finalValue),
          };
        })
      );
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result);
        if (errors.paymentProof)
          setErrors((prev) => ({ ...prev, paymentProof: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDesignFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDesignFile(reader.result);
        if (errors.designFile)
          setErrors((prev) => ({ ...prev, designFile: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdvanceChange = (val) => {
    setAdvance(val);
    if (Number(val) > totalAmount) {
      setErrors((prev) => ({ ...prev, advance: "You enter more then Final Amount" }));
    } else {
      setErrors((prev) => ({ ...prev, advance: null }));
    }
  };

  const handleFormSubmit = () => {
    if (!validate()) return;

    // Map frontend items to backend lineItems
    const lineItems = items.map((it) => ({
      description: it.isCustom ? it.customDesc || it.desc : it.desc,
      quantity: Number(it.qty),
      unitPrice: Number(it.cost),
      discount: 0, // Individual item discount not yet implemented in UI
      gstRate: applyGst ? 18 : 0,
    }));

    onSubmit({
      ...formData,
      lineItems,
      designFileUrl: designFile,
      clientSnapshot: {
        name: formData.name,
        phone: formData.phone,
        company: formData.company,
      },
      payment: {
        rawSubtotal,
        discount,
        discountAmount,
        taxableAmount,
        cgst,
        sgst,
        igst,
        totalAmount,
        advance: Number(advance),
        paymentMethod,
        paymentProof,
        requiresApproval: advanceLow,
      },
      // Backend expects these for initial payment record if needed
      initialPayment: {
        amount: Number(advance),
        method: paymentMethod,
        proofUrl: paymentProof,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-4xl rounded-2xl border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div
          className="flex items-center justify-between p-5 border-b shrink-0"
          style={{ background: "linear-gradient(135deg, #064e3b, #065f46)" }}
        >
          <div>
            <h2 className="text-white font-bold text-lg">
              🧾 Create New Order
            </h2>
            {client && (
              <p className="text-emerald-200 text-xs mt-0.5">
                Creating for {client.company || client.name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6 bg-slate-50">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">
              1. Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Executive Name
                </label>
                <input
                  name="executiveName"
                  value={formData.executiveName}
                  readOnly
                  className="h-9 w-full rounded border bg-slate-100 px-3 text-sm outline-none text-slate-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Order Date
                </label>
                <input
                  type="date"
                  name="orderDate"
                  value={formData.orderDate}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Order Type *
                </label>
                <select
                  name="orderType"
                  value={formData.orderType}
                  onChange={handleChange}
                  className={`h-9 w-full rounded border ${errors.orderType ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-green-500`}
                >
                  <option value="">Select Type...</option>
                  {clientTypes.length === 0 ? (
                    [
                      "renewal",
                      "renewal-agent",
                      "retail",
                      "retail-agent",
                      "agent",
                      "corporate",
                      "corporate-renewal",
                      "website",
                      "walk-in",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))
                  ) : (
                    clientTypes.map((ct) => (
                      <option key={ct._id} value={ct.key}>
                        {ct.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.orderType && (
                  <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                    {errors.orderType}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">
              2. Client Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Business Name *
                </label>
                <input
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className={`h-9 w-full rounded border ${errors.company ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-green-500`}
                />
                {errors.company && (
                  <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                    {errors.company}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Contact Person *
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`h-9 w-full rounded border ${errors.name ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-green-500`}
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Contact Number *
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`h-9 w-full rounded border ${errors.phone ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-green-500`}
                />
                {errors.phone && (
                  <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                    {errors.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Location *
                </label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`h-9 w-full rounded border ${errors.location ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-green-500`}
                />
                {errors.location && (
                  <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                    {errors.location}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  State *
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`h-9 w-full rounded border ${errors.state ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-green-500`}
                >
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                    {errors.state}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Pincode *
                </label>
                <input
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className={`h-9 w-full rounded border ${errors.pincode ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-green-500`}
                  maxLength={6}
                />
                {errors.pincode && (
                  <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                    {errors.pincode}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  GST Number (Optional)
                </label>
                <input
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Birth Date (Optional)
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Anniversary Date (Opt)
                </label>
                <input
                  type="date"
                  name="anniversaryDate"
                  value={formData.anniversaryDate}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">
                  Design Status
                </label>
                <select
                  name="designStatus"
                  value={formData.designStatus}
                  onChange={handleChange}
                  className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-green-500"
                >
                  <option value="Design Provided">Design Provided</option>
                  <option value="Need Design">Need Design</option>
                </select>
              </div>
              {formData.designStatus === "Design Provided" && (
                <div className="col-span-full md:col-span-3">
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Upload Design File *</label>
                  <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 relative min-h-[120px] transition-colors ${errors.designFile ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}>
                    {designFile ? (
                      <div className="text-center w-full">
                        {designFile.startsWith('data:image/') ? (
                          <img src={designFile} alt="Design Preview" className="w-full h-32 object-contain rounded-lg mb-2" />
                        ) : (
                          <div className="h-32 flex flex-col items-center justify-center bg-slate-100 rounded-lg mb-2 border border-slate-200">
                            <FileText className="h-10 w-10 text-slate-400 mb-1" />
                            <span className="text-xs font-bold text-slate-600 truncate max-w-[90%]">Design File Uploaded</span>
                          </div>
                        )}
                        <button type="button" onClick={() => setDesignFile(null)} className="text-xs text-red-600 font-bold hover:underline">Remove File</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full py-4">
                        <Upload className={`h-8 w-8 mb-2 ${errors.designFile ? 'text-red-300' : 'text-slate-300'}`} />
                        <span className={`text-[10px] font-bold ${errors.designFile ? 'text-red-500' : 'text-slate-500'}`}>Click to upload design file</span>
                        <input type="file" onChange={handleDesignFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                  {errors.designFile && <p className="text-[10px] text-red-500 mt-1 font-bold text-center">{errors.designFile}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-slate-800">
                3. Order Requirements
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveItemIndex(null);
                    setIsCatalogueOpen(true);
                  }}
                  className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition flex items-center gap-1"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Catalogue
                </button>
                <button
                  onClick={addItem}
                  className="text-xs font-bold text-white bg-green-600 px-3 py-1.5 rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 relative"
                >
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(i)}
                      className="absolute top-2 right-2 h-7 w-7 rounded bg-red-100 hover:bg-red-200 flex items-center justify-center shrink-0"
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Requirement
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            handleProductSelect(i, e.target.value)
                          }
                          className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none"
                        >
                          <option value="">Select product...</option>
                          {availableProducts.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.productName || p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`custom-${i}`}
                          checked={item.isCustom}
                          onChange={(e) =>
                            updateItem(i, "isCustom", e.target.checked)
                          }
                          className="rounded cursor-pointer"
                        />
                        <label
                          htmlFor={`custom-${i}`}
                          className="text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          Customization Required
                        </label>
                      </div>
                      {item.isCustom && (
                        <div className="mt-2">
                          <input
                            value={item.customDesc}
                            onChange={(e) =>
                              updateItem(i, "customDesc", e.target.value)
                            }
                            placeholder="Describe customization..."
                            className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(i, "qty", +e.target.value)}
                        className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Cost (₹)
                      </label>
                      <input
                        type="number"
                        value={item.cost}
                        onChange={(e) => updateItem(i, "cost", +e.target.value)}
                        disabled={!item.isCustom}
                        className={`h-9 w-full rounded border px-3 text-sm outline-none ${!item.isCustom ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-white border-slate-300"}`}
                        placeholder={
                          item.isCustom ? "Enter cost" : "Fixed cost"
                        }
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Delivery Date
                      </label>
                      <input
                        type="date"
                        value={item.deliveryDate}
                        onChange={(e) =>
                          updateItem(i, "deliveryDate", e.target.value)
                        }
                        className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                <span>Subtotal (Items):</span>
                <span>₹{rawSubtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700">
                    Discount Percentage (%):
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(Math.min(100, Math.max(0, +e.target.value)))
                    }
                    className="h-8 w-20 rounded border border-slate-300 px-2 text-sm outline-none focus:border-green-500"
                  />
                </div>
                <span className="text-sm font-medium text-red-600">
                  - ₹{discountAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded border border-dashed border-slate-200">
                <input
                  type="checkbox"
                  id="gst-check"
                  checked={applyGst}
                  onChange={(e) => setApplyGst(e.target.checked)}
                  className="h-4 w-4 cursor-pointer"
                />
                <label
                  htmlFor="gst-check"
                  className="text-sm font-bold text-slate-800 cursor-pointer"
                >
                  Apply GST (18%)
                </label>
              </div>

              {applyGst && (
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-2">
                  {!isInterState ? (
                    <>
                      <div className="flex justify-between text-xs font-medium text-blue-800">
                        <span>CGST (9%):</span>
                        <span>₹{cgst.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-blue-800">
                        <span>SGST (9%):</span>
                        <span>₹{sgst.toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-xs font-medium text-blue-800">
                      <span>IGST (18%):</span>
                      <span>₹{igst.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 rounded-xl border bg-green-50 p-4 flex justify-between items-center shadow-sm">
                <span className="text-sm font-bold text-slate-700">
                  Final Total Amount
                </span>
                <span className="font-black text-2xl text-green-700">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">
              4. Advanced Payment & Proof
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">
                    Advance Payment Received (₹) *
                  </label>
                  <input
                    type="number"
                    value={advance}
                    onChange={(e) => handleAdvanceChange(e.target.value)}
                    placeholder={`Min 50% (₹${(totalAmount * 0.5).toLocaleString("en-IN")})`}
                    className={`h-10 w-full rounded-lg border bg-slate-50 px-3 text-sm outline-none transition-colors ${errors.advance ? "border-red-500 bg-red-50" : advanceLow ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-green-500"}`}
                  />
                  {errors.advance && (
                    <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                      {errors.advance}
                    </p>
                  )}
                  {advanceLow && !errors.advance && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="font-medium">
                        Advance is below 50% ({advancePct.toFixed(0)}%). Manager
                        approval required.
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-green-500 bg-slate-50"
                  >
                    <option value="Cash">Cash</option>
                    <option value="PhonePe">PhonePe / UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 mb-2 block text-center">
                  Payment Proof (Screenshot/Receipt) *
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 relative min-h-[120px] transition-colors ${errors.paymentProof ? "border-red-500 bg-red-50" : "border-slate-300"}`}
                >
                  {paymentProof ? (
                    <div className="w-full h-full relative">
                      <img
                        src={paymentProof}
                        alt="Proof"
                        className="w-full h-32 object-contain rounded-lg"
                      />
                      <button
                        onClick={() => setPaymentProof(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Image
                        className={`h-8 w-8 mb-2 ${errors.paymentProof ? "text-red-300" : "text-slate-300"}`}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <span
                        className={`text-[10px] font-bold ${errors.paymentProof ? "text-red-500" : "text-slate-500"}`}
                      >
                        Click to upload image
                      </span>
                    </>
                  )}
                </div>
                {errors.paymentProof && (
                  <p className="text-[10px] text-red-500 mt-1 font-bold text-center">
                    {errors.paymentProof}
                  </p>
                )}
                <p className="mt-3 text-[10px] text-muted-foreground text-center italic">
                  Remaining balance: ₹
                  {(totalAmount - Number(advance || 0)).toLocaleString("en-IN")}
                  .
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t shrink-0 flex gap-4 bg-white">
          <button
            onClick={onClose}
            className="h-11 px-8 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleFormSubmit}
            className="flex-1 h-11 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-sm"
            style={{ background: advanceLow ? "#dc2626" : "#059669" }}
          >
            {advanceLow
              ? "⚠ Request Manager Approval"
              : "✅ Submit & Create Order"}
          </button>
        </div>
      </div>

      <ProductCatalogueModal
        isOpen={isCatalogueOpen}
        onClose={() => setIsCatalogueOpen(false)}
        mode="single"
        onSelectProduct={handleSelectFromCatalogue}
      />
    </div>
  );
};

// ─── Phone Search Modal ───────────────────────────────────────────────────────
export const PhoneSearchModal = ({ onClose, onSearch }) => {
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl overflow-hidden p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-8 text-slate-900">
          Search Prospect
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">
              10-Digit Mobile Number:
            </label>
            <input
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="Enter mobile number"
              className="h-10 w-full rounded border border-slate-300 bg-background px-3 text-sm outline-none focus:border-[#003366]"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">
              Business Name:
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter business name"
              className="h-10 w-full rounded border border-slate-300 bg-background px-3 text-sm outline-none focus:border-[#003366]"
            />
          </div>
          <button
            onClick={() =>
              onSearch({ phone, company: (company || "").toLowerCase() })
            }
            className="w-full h-10 rounded text-white font-semibold text-sm transition-colors hover:opacity-90"
            style={{ background: "#003366" }}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Prospect Details Modal ───────────────────────────────────────────────────
export const ProspectDetailsModal = ({
  prospect,
  onBack,
  onCreateNew,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-8 relative">
        <button
          onClick={onClose || onBack}
          className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">
          Prospect Details
        </h2>
        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
          {/* Read only fields with light grey background */}
          {[
            {
              label: "Prospect ID",
              value: prospect._id || prospect.id || "N/A",
            },
            {
              label: "Executive Name",
              value:
                (typeof prospect.assignedTo === "object"
                  ? prospect.assignedTo?.name
                  : null) ||
                prospect.executiveName ||
                "Not Assigned",
            },
            { label: "Business Name", value: prospect.company },
            { label: "Contact Person", value: prospect.name },
            { label: "Phone Number", value: prospect.phone },
            {
              label: "Location",
              value: prospect.requirement?.location || prospect.location,
            },
            { label: "Prospect Type", value: prospect.priority },
            { label: "Client Type", value: prospect.clientType },
            { label: "Lead From", value: prospect.source },
            {
              label: "Follow-up Date",
              value: prospect.nextFollowUpDate
                ? new Date(prospect.nextFollowUpDate).toLocaleDateString()
                : "N/A",
            },
            { label: "Services Needed", value: prospect.requirement?.service },
            { label: "Additional Notes", value: prospect.requirement?.notes },
          ].map((field, i) => (
            <div key={i}>
              <label className="text-xs font-bold text-slate-800 mb-1 block">
                {field.label}
              </label>
              <div className="w-full rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 min-h-[36px]">
                {field.value}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-6 flex justify-center gap-4 shrink-0">
          <button
            onClick={() => {
              if (onBack) onBack();
              navigate("/");
            }}
            className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:bg-green-600"
            style={{ background: "#4caf50" }}
          >
            Back to Dashboard
          </button>
          <button
            onClick={onCreateNew}
            className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:bg-blue-600"
            style={{ background: "#2196f3" }}
          >
            Create New Prospect
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Create/Edit Prospect Modal ────────────────────────────────────────────────
export const CreateProspectModal = ({
  phone,
  executiveName,
  onBack,
  onSubmit,
  onClose,
  initialData = null,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    executiveName:
      (typeof initialData?.assignedTo === "object"
        ? initialData?.assignedTo?.name
        : null) ||
      initialData?.executiveName ||
      executiveName ||
      "",
    name: initialData?.name || "",
    company: initialData?.company || "",
    phone: initialData?.phone || phone || "",
    location: initialData?.requirement?.location || "",
    source: initialData?.source || "",
    priority: initialData?.priority || "",
    nextFollowUpDate: initialData?.nextFollowUpDate
      ? new Date(initialData.nextFollowUpDate).toISOString().split("T")[0]
      : "",
    notes:
      initialData?.requirement?.notes ||
      (typeof initialData?.requirement === "string"
        ? initialData.requirement
        : ""),
    clientType: initialData?.clientType || "Retail",
    budget: initialData?.requirement?.budget || "",
  });

  const { user } = useAuth();
  const [availableProducts, setAvailableProducts] = useState([]);
  const [clientTypes, setClientTypes] = useState([]);

  React.useEffect(() => {
    Promise.all([
      productApi.list(user?.token),
      productApi.getClientTypes(user?.token).catch(() => ({ data: [] }))
    ])
      .then(([pRes, ctRes]) => {
        if (pRes.success)
          setAvailableProducts(pRes.data.filter((p) => p.status === "Active"));
        if (ctRes.data)
          setClientTypes(ctRes.data);
      })
      .catch(console.error);
  }, [user]);

  const [products, setProducts] = useState(
    initialData?.requirement?.service
      ? initialData.requirement.service.split(", ").filter(Boolean)
      : [],
  );
  const [customProduct, setCustomProduct] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);

  const removeProduct = (prod) => {
    setProducts(products.filter((p) => p !== prod));
  };

  const addCustomProduct = (e, val) => {
    e?.preventDefault();
    const toAdd = val || customProduct.trim();
    if (toAdd && !products.includes(toAdd)) {
      setProducts([...products, toAdd]);
    }
    setCustomProduct("");
    setShowSuggestions(false);
  };

  const filteredProducts = availableProducts
    .map((p) => p.productName || p.name)
    .filter(
      (name) =>
        name &&
        name.toLowerCase().includes((customProduct || "").toLowerCase()) &&
        !products.includes(name),
    );

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.company) newErrors.company = "Required";
    if (!formData.name) newErrors.name = "Required";
    if (!formData.phone) newErrors.phone = "Required";
    else if (formData.phone.length !== 10) newErrors.phone = "Enter 10 digits";

    if (!formData.location) newErrors.location = "Required";
    if (!formData.source) newErrors.source = "Required";
    if (!formData.priority) newErrors.priority = "Required";
    if (!formData.nextFollowUpDate) newErrors.nextFollowUpDate = "Required";
    if (products.length === 0) newErrors.products = "Add at least one product";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "phone") {
      finalValue = value.replace(/\D/g, "").slice(0, 10);
    } else if (name === "name") {
      finalValue = value.replace(/[^a-zA-Z\s]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFormSubmit = () => {
    if (!validate()) return;
    onSubmit({ ...formData, products });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-8 relative">
        <button
          onClick={onClose || onBack}
          className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-900">
          {initialData ? "Edit Prospect" : "Create New Prospect"}
        </h2>
        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Executive Name
            </label>
            <input
              name="executiveName"
              value={formData.executiveName}
              readOnly
              className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none bg-slate-50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Business Name *
            </label>
            <input
              name="company"
              value={formData.company}
              onChange={handleChange}
              className={`h-9 w-full rounded border ${errors.company ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-[#003366]`}
            />
            {errors.company && (
              <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                {errors.company}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Contact Person *
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`h-9 w-full rounded border ${errors.name ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-[#003366]`}
            />
            {errors.name && (
              <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Phone Number *
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`h-9 w-full rounded border ${errors.phone ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-[#003366]`}
            />
            {errors.phone && (
              <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                {errors.phone}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Location *
            </label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`h-9 w-full rounded border ${errors.location ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-[#003366]`}
            />
            {errors.location && (
              <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                {errors.location}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Lead From *
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className={`h-9 w-full rounded border ${errors.source ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-[#003366]`}
            >
              <option value="">Select Lead Source</option>
              <option>India mart</option>
              <option>Just dial</option>
              <option>Google ads</option>
              <option>Referral</option>
              <option>Website</option>
              <option>Meta (Facebook/Instagram)</option>
              <option>Walk-in</option>
              <option>Other</option>
            </select>
            {errors.source && (
              <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                {errors.source}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Prospect Type *
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={`h-9 w-full rounded border ${errors.priority ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-[#003366]`}
            >
              <option value="">Select Type</option>
              <option>Hot</option>
              <option>Cold</option>
              <option>Expected in next month</option>
            </select>
            {errors.priority && (
              <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                {errors.priority}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Client Type (For Pricing) *
            </label>
            <select
              name="clientType"
              value={formData.clientType}
              onChange={handleChange}
              className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]"
            >
              {clientTypes.length === 0 ? (
                <>
                  <option value="Retail">Retail</option>
                  <option value="Renewal">Renewal</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Corporate-Renewal">Corporate-Renewal</option>
                  <option value="Agent">Agent</option>
                  <option value="Agent-Renewal">Agent-Renewal</option>
                </>
              ) : (
                clientTypes.map((ct) => (
                  <option key={ct._id} value={ct.name}>
                    {ct.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Budget
            </label>
            <input
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="e.g. 5000"
              className="h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#003366]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Follow-up Date *
            </label>
            <input
              type="date"
              name="nextFollowUpDate"
              value={formData.nextFollowUpDate}
              onChange={handleChange}
              className={`h-9 w-full rounded border ${errors.nextFollowUpDate ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-[#003366]`}
            />
            {errors.nextFollowUpDate && (
              <p className="text-[10px] text-red-500 mt-0.5 font-bold">
                {errors.nextFollowUpDate}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 mb-2 block">
              Products / Services Needed *
            </label>

            {/* Selected Products Tags */}
            {products.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {products.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => removeProduct(p)}
                    className="px-3 py-1 rounded-full text-xs font-semibold border transition-colors bg-blue-600 text-white border-blue-600 shadow-sm flex items-center gap-1"
                  >
                    {p} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            {/* Autocomplete Input */}
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customProduct}
                  onChange={(e) => {
                    setCustomProduct(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                  onKeyDown={(e) => e.key === "Enter" && addCustomProduct(e)}
                  placeholder="Type product name to search or add..."
                  className={`h-9 flex-1 rounded border ${errors.products ? "border-red-500 bg-red-50" : "border-slate-300"} px-3 text-sm outline-none focus:border-[#003366]`}
                />
                <button
                  type="button"
                  onClick={addCustomProduct}
                  className="h-9 px-4 rounded bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsCatalogueOpen(true)}
                  className="h-9 px-3 rounded bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-1.5 shadow"
                  title="Browse Product Catalogue"
                >
                  <ShoppingBag className="h-4 w-4" /> Catalogue
                </button>
              </div>
              {errors.products && (
                <p className="text-[10px] text-red-500 mt-1 font-bold">
                  {errors.products}
                </p>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && customProduct.trim() && (
                <div className="absolute top-full left-0 right-20 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                      <div
                        key={p}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-slate-700 font-medium"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addCustomProduct(e, p);
                        }}
                      >
                        {p}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground italic">
                      Press "Add" to create custom product
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Additional Requirement Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003366] min-h-[60px]"
              placeholder="Specific details or dimensions..."
            />
          </div>
        </div>
        <div className="pt-6 flex justify-between shrink-0">
          <button
            onClick={() => {
              if (onBack) onBack();
              navigate("/");
            }}
            className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90"
            style={{ background: "#003366" }}
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => handleFormSubmit()}
            className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90"
            style={{ background: "#003366" }}
          >
            {initialData ? "Update Prospect" : "Submit Prospect"}
          </button>
        </div>

        <ProductCatalogueModal
          isOpen={isCatalogueOpen}
          onClose={() => setIsCatalogueOpen(false)}
          mode="multiple"
          title="Browse & Select Products"
          selectedIds={availableProducts
            .filter((ap) => products.includes(ap.productName || ap.name))
            .map((ap) => ap._id)}
          onSelectMultiple={(selectedProducts) => {
            const names = selectedProducts.map((p) => p.productName || p.name);
            const merged = Array.from(new Set([...products, ...names]));
            setProducts(merged);
          }}
        />
      </div>
    </div>
  );
};

export const QuotationModal = ({ prospect, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([{ product: "", qty: 1, unitPrice: 0 }]);
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [clientTypes, setClientTypes] = useState([]);
  const [productList, setProductList] = useState([]);

  React.useEffect(() => {
    Promise.all([
      productApi.getClientTypes(user?.token).catch(() => ({ success: false, data: [] })),
      productApi.list(user?.token).catch(() => ({ success: false, data: [] }))
    ])
      .then(([ctRes, pRes]) => {
        if (ctRes.success) setClientTypes(ctRes.data);
        if (pRes.success) setProductList(pRes.data.filter((p) => p.status === "Active"));
      })
      .catch(console.error);
  }, [user]);

  const getProductPriceForClientType = (product, clientType) => {
    if (!product) return 0;
    if (product.clientTypePricing) {
      if (product.clientTypePricing[clientType] !== undefined) {
        return product.clientTypePricing[clientType];
      }
      const match = Object.keys(product.clientTypePricing).find(
        k => k.toLowerCase() === clientType?.toLowerCase()
      );
      if (match && product.clientTypePricing[match] !== undefined) {
        return product.clientTypePricing[match];
      }
    }
    return product.pricingRules?.sellingPrice || product.pricingRules?.totalBasePrice || product.basePrice || 0;
  };

  // Pricing helper that checks database products first, falling back to dummy matrix
  const getPrice = (productName, clientType) => {
    const dbProduct = productList.find(
      (p) => (p.productName || p.name) === productName
    );
    if (dbProduct) {
      return getProductPriceForClientType(dbProduct, clientType);
    }

    const basePrice =
      {
        Boards: 500,
        Banners: 200,
        "Digital Marketing": 5000,
        Hoarding: 10000,
        Standees: 1500,
        Brochures: 100,
        "Social Media": 3000,
      }[productName] || 0;

    const ct = clientTypes.find(
      (c) =>
        c.name === clientType ||
        c.key === clientType ||
        c.name.toLowerCase() === (clientType || "").toLowerCase()
    );
    const multiplier = ct ? ct.multiplier : 1.0;
    return basePrice * multiplier;
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === "product") {
      newItems[index].unitPrice = getPrice(
        value,
        prospect?.clientType || "Retail",
      );
    }
    setItems(newItems);
  };

  const addItem = () =>
    setItems([...items, { product: "", qty: 1, unitPrice: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  const handleSelectFromCatalogue = (prodObj) => {
    const name = prodObj.productName || prodObj.name;
    const price = getProductPriceForClientType(prodObj, prospect?.clientType || "Retail");

    if (activeItemIndex !== null) {
      const newItems = [...items];
      newItems[activeItemIndex].product = name;
      newItems[activeItemIndex].unitPrice = price;
      setItems(newItems);
    } else {
      const newItem = {
        product: name,
        qty: prodObj.minimumOrderQuantity || 1,
        unitPrice: price,
      };
      if (items.length === 1 && !items[0].product && items[0].unitPrice === 0) {
        setItems([newItem]);
      } else {
        setItems([...items, newItem]);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-slate-900">
          Send Quotation
        </h2>

        <div className="overflow-y-auto flex-1 space-y-4 pr-2">
          {/* Pre-filled info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
            <div>
              <p className="text-xs text-muted-foreground">Client Name</p>
              <p className="font-semibold text-sm">{prospect?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Business</p>
              <p className="font-semibold text-sm">{prospect?.company}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-semibold text-sm">{prospect?.phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client Type</p>
              <p className="font-semibold text-blue-600 text-sm">
                {prospect?.clientType || "Retail"}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-800">
                Products/Services
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveItemIndex(null);
                    setIsCatalogueOpen(true);
                  }}
                  className="text-xs text-indigo-600 font-semibold flex items-center gap-1.5 hover:text-indigo-700 transition"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Catalogue
                </button>
                <button
                  onClick={addItem}
                  className="text-xs text-blue-650 font-semibold flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Item
                </button>
              </div>
            </div>

            {items.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2 items-end">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground block mb-0.5">
                    Select Product
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={item.product}
                      onChange={(e) => updateItem(i, "product", e.target.value)}
                      className="h-9 flex-1 rounded border border-slate-300 px-2 text-sm outline-none"
                    >
                      <option value="">Choose...</option>
                      {productList.length === 0 ? (
                        [
                          "Boards",
                          "Banners",
                          "Digital Marketing",
                          "Hoarding",
                          "Standees",
                          "Brochures",
                          "Social Media",
                        ].map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))
                      ) : (
                        productList.map((p) => (
                          <option key={p._id} value={p.productName || p.name}>
                            {p.productName || p.name}
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveItemIndex(i);
                        setIsCatalogueOpen(true);
                      }}
                      className="h-9 px-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center shrink-0"
                      title="Select from Catalogue"
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="w-20">
                  <label className="text-[10px] text-muted-foreground block mb-0.5">
                    Qty
                  </label>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateItem(i, "qty", +e.target.value)}
                    className="h-9 w-full rounded border border-slate-300 px-2 text-sm outline-none"
                    min="1"
                  />
                </div>
                <div className="w-24">
                  <label className="text-[10px] text-muted-foreground block mb-0.5">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(i, "unitPrice", +e.target.value)
                    }
                    className="h-9 w-full rounded border border-slate-300 px-2 text-sm outline-none bg-slate-50"
                  />
                </div>
                <div className="w-24">
                  <label className="text-[10px] text-muted-foreground block mb-0.5">
                    Total
                  </label>
                  <div className="h-9 w-full rounded border border-slate-100 bg-slate-100 px-2 text-sm flex items-center justify-end font-semibold text-slate-700">
                    ₹{item.qty * item.unitPrice}
                  </div>
                </div>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(i)}
                    className="h-9 w-9 rounded border border-red-200 bg-red-50 text-red-500 flex items-center justify-center shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t">
            <p className="text-lg font-bold text-slate-900">
              Total Estimate:{" "}
              <span className="text-blue-700">₹{total.toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-between shrink-0">
          <button
            onClick={onClose}
            className="h-10 px-6 rounded text-slate-600 font-semibold text-sm border hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ prospect, items, total })}
            className="h-10 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90 flex items-center gap-2"
            style={{ background: "#25d366" }}
          >
            <MessageCircle className="h-4 w-4" /> Send via WhatsApp
          </button>
        </div>
      </div>

      <ProductCatalogueModal
        isOpen={isCatalogueOpen}
        onClose={() => setIsCatalogueOpen(false)}
        mode="single"
        onSelectProduct={handleSelectFromCatalogue}
      />
    </div>
  );
};

// ─── Update Status Modal ────────────────────────────────────────────────────────
export const UpdateStatusModal = ({
  prospect,
  newStatus,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    status: newStatus || prospect?.status || "In-progress",
    date: prospect?.nextFollowUpDate
      ? new Date(prospect.nextFollowUpDate).toISOString().split("T")[0]
      : "",
    remark: prospect?.lastInteractionNote || "",
    reason: prospect?.cancelReason || "",
    orderId: "",
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-md rounded-xl border bg-white shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold mb-1 text-slate-900">
            {formData.status === "In-progress"
              ? "Schedule Next Follow-up"
              : formData.status === "Canceled"
                ? "Cancel Prospect"
                : "Close Sale"}
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            {formData.status === "In-progress"
              ? "Let's keep the momentum going. When should we reach out next?"
              : formData.status === "Canceled"
                ? "Sorry to hear that. What was the main reason they didn't proceed?"
                : "Awesome news! Let's get this order officially recorded."}
          </p>

          <div className="space-y-5">
            {formData.status === "In-progress" && (
              <>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                    When should we contact them? *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-shadow"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                    What was discussed? *
                  </label>
                  <textarea
                    value={formData.remark}
                    onChange={(e) =>
                      setFormData({ ...formData, remark: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-shadow min-h-[90px]"
                    placeholder="Briefly describe the conversation..."
                  />
                </div>
              </>
            )}

            {formData.status === "Canceled" && (
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                  Cancellation Reason *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-shadow min-h-[90px]"
                  placeholder="e.g. Budget too low, chose competitor..."
                />
              </div>
            )}

            {["Sale Confirmed", "Order Confirmed"].includes(formData.status) && (
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                  Link to Order ID *
                </label>
                <input
                  type="text"
                  value={formData.orderId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orderId: e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9-]/g, ""),
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-shadow"
                  placeholder="e.g. ORD-12345"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded text-slate-600 font-semibold text-sm border bg-white hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="h-9 px-6 rounded text-white font-semibold text-sm transition-colors hover:opacity-90 bg-blue-600"
          >
            Save Update
          </button>
        </div>
      </div>
    </div>
  );
};
// ─── Order Details Modal ─────────────────────────────────────────────────────
export const OrderDetailsModal = ({ orderId, onClose, onPaymentUpload, onVerificationSuccess }) => {
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderApi.get(orderId, user.token);
        if (res.success) setOrder(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId, user.token]);

  if (loading)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-600">
            Loading Order Details...
          </p>
        </div>
      </div>
    );

  if (!order) return null;

  const hasPendingPayment = (order.paymentRecords || []).some(p => p.status === 'Pending');
  const steps = [
    { 
      label: 'Pay Verify', 
      status: hasPendingPayment ? 'current' : (['Confirmed', 'Design_Pending', 'Design_InProgress', 'Design_Review', 'Design_Approved', 'In_Production', 'Ready_To_Deliver', 'Delivered', 'Completed'].includes(order.status) ? 'done' : 'waiting') 
    },
    { 
      label: 'Ord Verify', 
      status: order.verificationStatus === 'Verified' ? 'done' : (order.verificationStatus === 'Pending' && !hasPendingPayment ? 'current' : 'waiting') 
    },
    { 
      label: 'Designer', 
      status: ['Approved', 'Completed', 'Not_Required'].includes(order.designStatus) ? 'done' : (order.status.startsWith('Design_') ? 'current' : 'waiting') 
    },
    { 
      label: 'Ops Mgr', 
      status: ['Ready_To_Deliver', 'Delivered', 'Completed'].includes(order.status) ? 'done' : (order.status === 'In_Production' ? 'current' : 'waiting') 
    },
    { 
      label: 'Services', 
      status: order.status === 'Completed' ? 'done' : (order.status === 'Ready_To_Deliver' || order.status === 'Delivered' ? 'current' : 'waiting') 
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl border bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight">
                  {order.orderNumber}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${order.status === "Completed" ? "bg-green-500" : "bg-blue-500"}`}
                >
                  {order.status.replace("_", " ")}
                </span>
                {order.verificationStatus === 'Pending' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white animate-pulse">
                    Order Verification Pending
                  </span>
                )}
                {order.verificationStatus === 'Verified' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                    Order Verified by {order.verifiedByName} ({order.verifiedByRole})
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs font-medium mt-0.5">
                Created on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
          {/* Top Grid: Client & Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Info */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-5 rounded-2xl border shadow-sm h-full">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="h-6 w-1 bg-blue-600 rounded-full" />
                  Client Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                      Business Name
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {order.clientSnapshot?.company}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                      Contact Person
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {order.clientSnapshot?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.clientSnapshot?.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                      Order Type
                    </p>
                    <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-tighter mt-1 border border-blue-100">
                      {order.orderType}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline & Design */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="h-6 w-1 bg-emerald-500 rounded-full" />
                  Order Journey
                </h3>
                <div className="flex items-center justify-between relative px-2">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 -z-0 mx-8" />
                  {steps.map((s, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-2 z-10"
                    >
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center border-4 ${s.status === "done" ? "bg-emerald-500 border-emerald-100" : s.status === "current" ? "bg-blue-600 border-blue-100 animate-pulse" : "bg-slate-100 border-white"}`}
                      >
                        {s.status === "done" ? (
                          <CheckCircle className="h-5 w-5 text-white" />
                        ) : (
                          <div
                            className={`h-2 w-2 rounded-full ${s.status === "current" ? "bg-white" : "bg-slate-300"}`}
                          />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${s.status === "waiting" ? "text-slate-400" : "text-slate-800"}`}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="h-6 w-1 bg-purple-500 rounded-full" />
                    Design Workflow
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${order.designStatus === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-purple-50 text-purple-700 border border-purple-100"}`}
                  >
                    {order.designStatus?.replace("_", " ") || "Pending"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                    <Image className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-600 italic">
                      "{order.designNotes || "No design notes provided yet."}"
                    </p>
                    {order.designAssignedTo && (
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        Assigned to Designer:{" "}
                        <span className="text-slate-800">
                          {order.designAssignedTo.name}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Items & Totals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Service Items
                </h3>
                <span className="text-[10px] font-bold bg-slate-200 px-2 py-0.5 rounded-full">
                  {order.lineItems?.length || 0} Products
                </span>
              </div>
              <div className="divide-y">
                {order.lineItems?.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {item.description}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">
                        Qty: {item.quantity} {item.unit || "pcs"} · Unit Price:
                        ₹{item.unitPrice.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">
                        ₹{item.amount?.toLocaleString("en-IN")}
                      </p>
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
                        Verified ✓
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Subtotal
                  </span>
                  <span className="text-sm font-bold">
                    ₹{order.subtotal?.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Tax (GST)
                  </span>
                  <span className="text-sm font-bold">
                    ₹{order.totalGST?.toLocaleString("en-IN")}
                  </span>
                </div>
                {order.totalDiscount > 0 && (
                  <div className="flex justify-between items-center text-rose-400">
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Discount
                    </span>
                    <span className="text-sm font-bold">
                      -₹{order.totalDiscount?.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="h-px bg-white/10 my-4" />
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-400">
                    Grand Total
                  </span>
                  <span className="text-2xl font-black">
                    ₹{order.grandTotal?.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              {(order.paymentRecords || []).some(p => p.status === 'Pending') ? (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 bg-red-500/20 rounded-xl p-3 border border-red-400/30 mb-3">
                    <span className="text-xl">💰</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-300">Payment Verification Pending</p>
                      <p className="text-[9px] text-red-400 mt-0.5">
                        ₹{(order.paymentRecords || []).filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0).toLocaleString('en-IN')} awaiting verification by Accountant/Admin
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 text-right uppercase">Paid & Balance will show after verification</p>
                </div>
              ) : (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-400">Amount Verified</span>
                    <span className="text-emerald-400">
                      ₹{order.totalPaid?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      style={{
                        width: `${Math.min(100, ((order.totalPaid || 0) / (order.grandTotal || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 text-right font-black uppercase tracking-widest">
                    Balance: ₹{order.balanceDue?.toLocaleString("en-IN")}
                  </p>
                </div>
              )}
            </div>
          </div>


          {/* Payment History & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="h-6 w-1 bg-amber-500 rounded-full" />
                  Payment History
                </h3>
                <button
                  onClick={() => onPaymentUpload(order)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Installment
                </button>
              </div>
              <div className="p-4">
                {order.paymentRecords?.length === 0 ? (
                  <div className="text-center py-8">
                    <IndianRupee className="h-8 w-8 mx-auto mb-2 opacity-10" />
                    <p className="text-xs text-slate-400 italic">
                      No payment records found.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {order.paymentRecords.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${p.status === "Verified" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                          >
                            {p.method === "Cash" ? "💵" : "💳"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              ₹{p.amount?.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {p.method} ·{" "}
                              {new Date(
                                p.receivedAt || p.createdAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${p.status === "Verified" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                          >
                            {p.status}
                          </span>
                          {p.proofUrl && (
                            <a
                              href={p.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-[9px] text-blue-600 mt-1 font-bold underline"
                            >
                              View Proof
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="h-6 w-1 bg-blue-400 rounded-full" />
                Recent Updates
              </h3>
              <div className="space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {order.timeline
                  ?.slice(-5)
                  .reverse()
                  .map((ev, i) => (
                    <div key={i} className="flex gap-4 relative">
                      <div className="h-4 w-4 rounded-full bg-white border-4 border-blue-500 z-10 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-800 leading-none">
                          {ev.event}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {ev.detail}
                        </p>
                        <p className="text-[9px] text-slate-300 mt-1 font-medium">
                          {new Date(ev.at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-between items-center shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Powered by GMS Enterprise
          </p>
          <div className="flex gap-3">
            {['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'ACCOUNTS'].includes(user?.role) && order.verificationStatus === 'Pending' && (
              <button 
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to verify payments and confirm Order #${order.orderNumber}?`)) {
                    try {
                      const res = await orderApi.verify(order._id || order.id, user.token);
                      if (res.success) {
                        alert('Order verified successfully!');
                        const updated = await orderApi.get(order._id || order.id, user.token);
                        if (updated.success) setOrder(updated.data);
                        onVerificationSuccess?.();
                      }
                    } catch (err) {
                      alert(err.message || 'Verification failed');
                    }
                  }
                }}
                className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm animate-pulse"
              >
                🛡 Verify Order
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="h-9 px-4 rounded-xl border bg-white text-xs font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print Invoice
            </button>
            <button
              onClick={onClose}
              className="h-9 px-8 rounded-xl bg-slate-900 text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Close View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// ─── Payment Upload Modal ───────────────────────────────────────────────────
export const PaymentUploadModal = ({ order, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    amount: "",
    method: "UPI",
    proofUrl: "",
    reference: "",
    paymentType: "Partial",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.proofUrl) {
      alert("Amount and Proof are required.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Record Payment
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Order: {order?.orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">
              <span>Remaining Balance</span>
              <span>Total Value</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-blue-700">
                ₹{order?.balanceDue?.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-blue-900 opacity-60">
                ₹{order?.grandTotal?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                Amount Collected (₹) *
              </label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="e.g. 5000"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                Method *
              </label>
              <select
                value={formData.method}
                onChange={(e) =>
                  setFormData({ ...formData, method: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-blue-600 transition-all"
              >
                <option value="UPI">UPI / PhonePe</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                Payment Type
              </label>
              <select
                value={formData.paymentType}
                onChange={(e) =>
                  setFormData({ ...formData, paymentType: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-blue-600 transition-all"
              >
                <option value="Advance">Advance (50%+)</option>
                <option value="Partial">Partial / EMI</option>
                <option value="Final">Final Settlement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
              Transaction Reference / Ref No.
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
              placeholder="UPI Transaction ID or Ref #"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
              Proof URL (Screenshot/Photo) *
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={formData.proofUrl}
                onChange={(e) =>
                  setFormData({ ...formData, proofUrl: e.target.value })
                }
                placeholder="https://..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-600 transition-all"
              />
              <Link className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            </div>
            <p className="text-[9px] text-slate-400 mt-1 italic">
              Paste the link to the payment screenshot here.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
              Collection Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Any additional details..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-600 transition-all min-h-[80px]"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] h-12 rounded-xl bg-slate-900 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <IndianRupee className="h-4 w-4" />
              )}
              {loading ? "Submitting..." : "Submit Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Assign Appointment Modal ────────────────────────────────────────────────
import { employeeApi } from "../../../services/api";

export const AssignAppointmentModal = ({
  appointment,
  onClose,
  onAssigned,
}) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  React.useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await employeeApi.list({ status: "ACTIVE" }, user.token);
        // Filter for Field Execs, Managers, CEO, or Admin
        const filtered = (res.employees || res.data || []).filter((e) =>
          ["FIELD_EXEC", "SALES_MANAGER", "MD_CEO", "ADMIN"].includes(e.role),
        );
        setEmployees(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [user.token]);

  const handleAssign = async () => {
    if (!selectedId) return alert("Please select a person");
    setAssigning(true);
    try {
      const res = await appointmentApi.assign(
        appointment._id,
        { assignedTo: selectedId },
        user.token,
      );
      if (res.success) {
        onAssigned?.();
        onClose();
      }
    } catch (err) {
      alert(err.message || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)" }}
        >
          <div>
            <h2 className="text-white font-bold text-lg">Assign Personnel</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Appt: {appointment.businessName}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
              <span>Meeting Info</span>
              <span className="text-blue-600">
                {new Date(appointment.date).toLocaleDateString()} ·{" "}
                {appointment.time}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {appointment.venue}
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Select Executive / Manager
            </label>
            {loading ? (
              <div className="h-10 w-full animate-pulse bg-slate-100 rounded-xl" />
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-blue-600 transition-all shadow-sm"
              >
                <option value="">Select person...</option>
                {employees.map((e) => {
                  const roleName =
                    e.role === "MD_CEO"
                      ? "CEO"
                      : e.role === "FIELD_EXEC"
                        ? "Field Executive"
                        : e.role === "SALES_MANAGER"
                          ? "Sales Manager"
                          : e.role === "ADMIN"
                            ? "Admin"
                            : e.role.replace("_", " ");
                  return (
                    <option key={e._id} value={e._id}>
                      {e.name} ({roleName})
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="h-12 flex-1 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={assigning || !selectedId}
              className="h-12 flex-1 rounded-xl bg-slate-900 text-white text-sm font-bold flex justify-center items-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
            >
              {assigning ? "Assigning..." : "Confirm Assignment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Update Appointment Remark Modal ──────────────────────────────────────────
export const UpdateAppointmentRemarkModal = ({
  appointment,
  onClose,
  onSaved,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    assigneeRemark: appointment.assigneeRemark || appointment.remark || "",
    status: appointment.status || "IN_PROGRESS",
    nextFollowUpDate: (appointment.nextFollowUpDate && !isNaN(new Date(appointment.nextFollowUpDate).getTime())) ? new Date(appointment.nextFollowUpDate).toISOString().split('T')[0] : "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assigneeRemark.trim()) return alert("Please enter an assignee remark");
    
    // Check if nextFollowUpDate is required
    if ((formData.status === 'FOLLOWUP_REQUIRED' || formData.status === 'RESCHEDULED') && !formData.nextFollowUpDate) {
      return alert("Please select a next follow-up date");
    }

    setLoading(true);
    try {
      const res = await appointmentApi.updateRemark(
        appointment._id,
        {
          assigneeRemark: formData.assigneeRemark,
          status: formData.status,
          nextFollowUpDate: formData.nextFollowUpDate
        },
        user.token,
      );
      if (res.success) {
        onSaved?.();
        onClose();
      }
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
        >
          <div>
            <h2 className="text-white font-bold text-lg">
              Update Visit Outcome
            </h2>
            <p className="text-emerald-200 text-xs mt-0.5">
              Appt with {appointment.businessName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Assignee Remark / Notes
            </label>
            <textarea
              required
              rows={4}
              placeholder="What was the outcome of this visit? Mention any client concerns or next steps..."
              value={formData.assigneeRemark}
              onChange={(e) =>
                setFormData({ ...formData, assigneeRemark: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none shadow-inner"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Update Appointment Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all shadow-sm"
            >
              <option value="PENDING">Pending</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="FOLLOWUP_REQUIRED">Follow-up Required</option>
              <option value="CLIENT_NOT_AVAILABLE">Client Not Available</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="SALE_CONFIRMED">Sale Confirmed (Won)</option>
              <option value="LOST">Lost / Rejected</option>
            </select>
          </div>

          {(formData.status === 'FOLLOWUP_REQUIRED' || formData.status === 'RESCHEDULED') && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Next Follow-up Date
              </label>
              <input
                required
                type="date"
                value={formData.nextFollowUpDate}
                onChange={(e) =>
                  setFormData({ ...formData, nextFollowUpDate: e.target.value })
                }
                className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-12 flex-1 rounded-xl bg-emerald-600 text-white text-sm font-bold flex justify-center items-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-100"
            >
              {loading ? "Updating..." : "Save & Close Visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
