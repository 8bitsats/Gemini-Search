# Cheshire Terminal

Cheshire Terminal is a revolutionary search platform that combines the power of AI-driven web search with native Solana blockchain exploration capabilities. It's the first of its kind to integrate Google's Gemini AI with direct Solana blockchain querying, providing a seamless experience for both web and blockchain research.

## 🌟 Key Features

### 1. Dual-Mode Search
- **Web Search Mode** 🌐
  - Powered by Google's Gemini AI
  - Aggregates results from multiple sources (Google, Perplexity, Tavily)
  - Provides AI-synthesized summaries with source citations
  - Supports natural language follow-up questions

- **Blockchain Search Mode** ⛓️
  - Direct Solana blockchain exploration
  - Search by:
    - Wallet addresses
    - Token addresses
    - Transaction hashes
    - Token names/symbols
  - Real-time blockchain data with Solscan integration

### 2. Advanced UI Features
- Seamless mode switching between web and blockchain search
- Smooth animations and transitions
- Dark mode optimized interface
- Responsive design for all devices
- Real-time search suggestions

### 3. Interactive Results
- Rich markdown formatting for search results
- Source attribution with clickable links
- Follow-up question support for deep diving
- Blockchain data visualization
- Transaction history views

## 🔧 API Endpoints

### Web Search Endpoints

```typescript
// 1. Initial Search
GET /api/search
Query Parameters:
  - q: string (search query)
Response: {
  sessionId: string,
  summary: string (HTML formatted),
  sources: Array<{
    title: string,
    url: string,
    snippet: string
  }>
}

// 2. Follow-up Questions
POST /api/follow-up
Body: {
  sessionId: string,
  query: string
}
Response: {
  summary: string (HTML formatted),
  sources: Array<{...}>
}
```

### Blockchain Search Endpoints

```typescript
// 1. Solana Account Search
GET /api/solana/search
Query Parameters:
  - q: string (address/token/query)
Response: {
  summary: string (HTML formatted),
  sources: Array<{
    title: string,
    url: string,
    snippet: string
  }>
}

// Account data includes:
- Account type
- SOL balance
- Owner program
- Token information (if applicable)
- Transaction history
```

## 🛠️ Technical Stack

### Frontend
- React with TypeScript
- Framer Motion for animations
- TailwindCSS for styling
- Wouter for routing
- Tanstack Query for data fetching

### Backend
- Express.js server
- Google Gemini AI integration
- Solana Web3.js
- Solscan API integration
- WebSocket support for real-time updates

## 🌈 What Makes It Unique

1. **First Gemini-Powered Solana Explorer**
   - Combines Google's latest AI technology with blockchain exploration
   - Natural language processing for blockchain queries
   - AI-synthesized explanations of blockchain data

2. **Seamless Integration**
   - Switch between web and blockchain search modes instantly
   - Unified interface for both search types
   - Consistent user experience across modes

3. **Rich Data Visualization**
   - Interactive blockchain data displays
   - Transaction flow visualization
   - Token holder statistics
   - Historical data charts

4. **Developer-Friendly**
   - Clean API design
   - Comprehensive documentation
   - Easy integration points
   - Extensible architecture

## 🚀 Future Roadmap

1. **Enhanced Blockchain Features**
   - NFT collection exploration
   - DeFi protocol integration
   - Cross-chain search capabilities
   - Smart contract analysis

2. **AI Improvements**
   - Blockchain-aware AI responses
   - Transaction pattern analysis
   - Wallet behavior insights
   - Market trend predictions

3. **User Experience**
   - Customizable dashboards
   - Saved searches
   - Real-time alerts
   - Mobile app development

## 🔍 Example Use Cases

1. **Research Mode**
   ```
   Query: "What is Solana?"
   Result: Comprehensive explanation with both web sources and blockchain metrics
   ```

2. **Blockchain Explorer Mode**
   ```
   Query: [Wallet Address]
   Result: Detailed wallet analysis with transaction history and token holdings
   ```

3. **Token Research**
   ```
   Query: "GRIN DAO token"
   Result: Token metrics, holder statistics, and recent transactions
   ```

## 🤝 Contributing

We welcome contributions! Whether it's:
- Feature suggestions
- Bug reports
- Code contributions
- Documentation improvements

Please feel free to open issues and pull requests.

## 📝 License

MIT License - feel free to use and modify as needed.

---

Built with ❤️ by the Cheshire Terminal Team
