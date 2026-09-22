import React, { useEffect, useState } from 'react';
import { useClient360 } from '../../services/client360Service';
import { ResponsiveTableWrapper } from '../../../../components/ui/ResponsiveComponents';

const OrdersTab = ({ phone, company }) => {
  const { fetchPaginated, loading } = useClient360();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [phone, company, page]);

  const loadOrders = async () => {
    try {
      const res = await fetchPaginated(phone, 'orders', page, 10, company);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && orders.length === 0) return <div className="p-6 text-slate-500">Loading orders...</div>;

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">Order History</h3>
      {orders.length === 0 ? (
        <div className="text-slate-500 py-4 text-center bg-slate-50 rounded-lg">No orders found for this client.</div>
      ) : (
        <ResponsiveTableWrapper>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 font-medium">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Order No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Sales Exec</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(order => (
                <tr key={order._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{order.orderNumber || order._id.substring(0,8)}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{order.salesExecutive?.name || order.createdBy?.name || 'System'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">₹{(order.totalAmount || order.grandTotal || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <a href={`/orders/${order._id}`} className="text-blue-600 hover:underline">View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTableWrapper>
      )}
    </div>
  );
};

export default OrdersTab;
