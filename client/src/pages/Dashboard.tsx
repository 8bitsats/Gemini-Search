import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

import TransactionHistory from '../components/TransactionHistory';
import WalletBalance from '../components/WalletBalance';

interface TokenOverview {
  price: number;
  liquidity: number;
  supply: number;
  marketcap: number;
  holder: number;
  priceChange24hPercent: number;
  volume24hUSD: number;
}

interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  logoURI: string;
}

const Dashboard = () => {
  const [overview, setOverview] = useState<TokenOverview | null>(null);
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, metadataRes] = await Promise.all([
          axios.get('/api/birdeye/token/overview'),
          axios.get('/api/birdeye/token/metadata')
        ]);

        setOverview(overviewRes.data.data);
        setMetadata(metadataRes.data.data);
      } catch (err) {
        setError('Failed to fetch token data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Set up polling for price updates
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!overview || !metadata) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Token Header */}
      <div className="flex items-center mb-8">
        <img src={metadata.logoURI} alt={metadata.name} className="w-16 h-16 rounded-full mr-4" />
        <div>
          <h1 className="text-3xl font-bold">{metadata.name} ({metadata.symbol})</h1>
          <p className="text-gray-600 mt-1">{metadata.description}</p>
        </div>
      </div>

      {/* Price and Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-gray-500 text-sm">Price</h2>
          <div className="flex items-center mt-1">
            <span className="text-2xl font-bold">${overview.price.toFixed(6)}</span>
            <span className={`ml-2 ${overview.priceChange24hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {overview.priceChange24hPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-gray-500 text-sm">Market Cap</h2>
          <p className="text-2xl font-bold mt-1">${overview.marketcap.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-gray-500 text-sm">24h Volume</h2>
          <p className="text-2xl font-bold mt-1">${overview.volume24hUSD.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-gray-500 text-sm">Holders</h2>
          <p className="text-2xl font-bold mt-1">{overview.holder.toLocaleString()}</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-4">Supply Information</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Supply</span>
              <span className="font-medium">{overview.supply.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Liquidity</span>
              <span className="font-medium">${overview.liquidity.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-4">Price Statistics</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">24h Change</span>
              <span className={`font-medium ${overview.priceChange24hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {overview.priceChange24hPercent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">24h Volume</span>
              <span className="font-medium">${overview.volume24hUSD.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Wallet Lookup</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter wallet address"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setWalletAddress(inputValue)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Look up
            </button>
          </div>
        </div>

        {walletAddress && (
          <div className="space-y-6">
            <WalletBalance address={walletAddress} />
            <TransactionHistory walletAddress={walletAddress} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
