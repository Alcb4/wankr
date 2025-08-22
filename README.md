# WANKR - Enhanced Shame-as-a-Service Token

This is an enhanced version of the WANKR project, building upon the original [WANKR repository](https://github.com/mrpapawheelie/wankr) with additional analytics and data visualization features.

## 🚀 Features

### Main Landing Page (`/`)
- **Clean "Shame." hero design** from the main WANKR repo
- **Three action buttons**: Read Whitepaper, BUY $WANKR, Use WANKR
- **Minimal, focused experience** for newcomers
- **"Use WANKR" button** that takes users to the enhanced dashboard

### Enhanced Dashboard (`/new-layout`)
- **Live Shame Feed** - Real-time shame transactions from Base chain
- **Send Shame** - Deliver shame to anyone on the Base chain
- **Dune Analytics** - Upvote trends and analytics from Dune
- **Upvote Charts** - Visual representation of upvote patterns
- **Leaderboards** - Top $WANKR holders and shame soldiers
- **Price Chart** - DexScreener integration for $WANKR price
- **Quick Stats** - Real-time statistics and metrics
- **Wallet Integration** - Full Web3 wallet connectivity

## 🎨 Design System

This project maintains consistency with the original WANKR design:
- **Official WANKR color palette** with gradients and glass morphism
- **Responsive design** that works on all devices
- **Consistent component library** with reusable UI elements
- **Smooth animations** and hover effects

## 🛠️ Technology Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Viem v2** for Ethereum interactions
- **Wagmi v2** for React hooks
- **Shadcn UI** for component library
- **Dune Analytics** for data visualization

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd wankr-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.local.example .env.local
   # Add your API keys and configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main landing page
│   ├── dashboard/
│   │   └── page.tsx          # Enhanced features dashboard
│   ├── components/
│   │   ├── layout/           # Layout components
│   │   ├── ShameFeed/        # Shame feed components
│   │   ├── SendWankr/        # Send shame functionality
│   │   ├── Leaderboard/      # Leaderboard components
│   │   ├── DuneUpvoteChart/  # Dune analytics
│   │   ├── UpvoteChart/      # Upvote visualization
│   │   └── Wallet/           # Wallet integration
│   ├── theme/                # Design system and styling
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API services
│   └── utils/                # Utility functions
```

## 🔗 Links

- **Main Repository**: [https://github.com/mrpapawheelie/wankr](https://github.com/mrpapawheelie/wankr)
- **Live Demo**: [wankr.vercel.app](https://wankr.vercel.app)
- **Whitepaper**: [WANKR Whitepaper](https://github.com/mrpapawheelie/wankr/blob/main/assets/WANKR_Whitepaper.pdf)
- **Buy $WANKR**: [CowSwap](https://swap.cow.fi/#/8453/swap/ETH/Wankr)

## 🤝 Contributing

This project builds upon the original WANKR repository. To contribute:

1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original WANKR project by [@mrpapawheelie](https://github.com/mrpapawheelie)
- Base chain community for the shame economy concept
- All contributors to the WANKR ecosystem
