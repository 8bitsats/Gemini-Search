import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

interface Transaction {
  txHash: string;
  blockTime: string;
  status: boolean;
  from: string;
  to: string;
  balanceChange: Array<{
    amount: number;
    symbol: string;
    decimals: number;
    address: string;
  }>;
}

interface TransactionHistoryProps {
  walletAddress?: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ walletAddress }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/birdeye/wallet/transactions/${walletAddress}`);
        setTransactions(response.data.data.solana || []);
      } catch (err) {
        setError('Failed to fetch transaction history');
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [walletAddress]);

  if (loading) return <div className="text-center py-4">Loading transactions...</div>;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
  if (!walletAddress) return <div className="text-center py-4">Enter a wallet address to view transactions</div>;
  if (transactions.length === 0) return <div className="text-center py-4">No transactions found</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Transaction History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => {
              const cheshChange = tx.balanceChange.find(
                (change) => change.address === 'FwVFweNUdUbfJUKAzreyTYVQoeW6LyqaPcLcn3tzY1ZS'
              );
              const amount = cheshChange ? cheshChange.amount / Math.pow(10, cheshChange.decimals) : 0;

              return (
                <tr key={tx.txHash} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tx.blockTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {amount >= 0 ? 'Receive' : 'Send'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {amount >= 0 ? '+' : ''}{amount.toLocaleString()} CHESH
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tx.status
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tx.status ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;
