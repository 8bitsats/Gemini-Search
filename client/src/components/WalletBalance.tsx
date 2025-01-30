import {
  type FC,
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

interface WalletBalanceProps {
  address: string;
}

interface TokenBalance {
  address: string;
  decimals: number;
  balance: number;
  uiAmount: number;
}

const WalletBalance: FC<WalletBalanceProps> = ({ address }) => {
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/birdeye/wallet/balance/${address}`);
        setBalance(response.data.data);
      } catch (err) {
        setError('Failed to fetch wallet balance');
        console.error('Error fetching balance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [address]);

  if (loading) return <div className="text-center py-4">Loading balance...</div>;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
  if (!balance) return <div className="text-center py-4">No balance data available</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Wallet Balance</h3>
        <span className="text-sm text-gray-500">
          {address.slice(0, 4)}...{address.slice(-4)}
        </span>
      </div>
      <div className="mt-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">CHESH Balance</span>
          <span className="text-xl font-semibold">
            {balance.uiAmount.toLocaleString()} CHESH
          </span>
        </div>
      </div>
    </div>
  );
};

export default WalletBalance;
