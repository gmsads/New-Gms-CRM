import React, { useEffect, useState } from 'react';
import { useClient360 } from '../../services/client360Service';
import { ResponsiveTableWrapper } from '../../../../components/ui/ResponsiveComponents';

const PaymentsTab = ({ phone, company }) => {
  const { fetchPaginated, loading } = useClient360();
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadPayments();
  }, [phone, company, page]);

  const loadPayments = async () => {
    try {
      const res = await fetchPaginated(phone, '', page, 10, company);
      setPayments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && payments.length === 0) return <div className="p-6 text-slate-500">Loading payments...</div>;

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">Payment Ledger</h3>
      {payments.length === 0 ? (
        <div className="text-slate-500 py-4 text-center bg-slate-50 rounded-lg">No payments found.</div>
      ) : (
        <ResponsiveTableWrapper>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 font-medium">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Receipt No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 rounded-tr-lg">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map(payment => (
                <tr key={payment._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{payment.paymentNumber || payment._id.substring(0,8)}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{payment.method || payment.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'Completed' || payment.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-green-600">₹{(payment.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{payment.createdBy?.name || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTableWrapper>
      )}
    </div>
  );
};

export default PaymentsTab;
