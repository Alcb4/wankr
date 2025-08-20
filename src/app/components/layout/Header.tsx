import Image from 'next/image'
import { components } from '../../theme'

export function Header() {
  return (
    <header className="text-center py-6 px-4">
      {/* Logo and Title on same line */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <Image
          src="/wankr-logo.svg"
          alt="WANKR Logo"
          width={60}
          height={60}
          className="animate-float"
        />
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-wankr text-gradient-hero font-extrabold tracking-tight">
          WANKR
        </h1>
      </div>
      
      {/* Subtitle */}
      <h2 className="text-xl md:text-2xl font-wankr text-gradient-hero mb-3">
        The Shame Economy
      </h2>
      
      {/* Action buttons */}
      <div className="flex flex-row gap-3 justify-center items-center mb-4">
        <a 
          href="https://github.com/mrpapawheelie/wankr/blob/main/assets/WANKR_Whitepaper.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className={`
            ${components.button.primary}
            hover:scale-105 transition-transform duration-200
          `}
        >
          Read Whitepaper
        </a>
        <a 
          href="https://swap.cow.fi/#/8453/swap/ETH/Wankr"
          target="_blank"
          rel="noopener noreferrer"
          className={`
            ${components.button.secondary}
            hover:scale-105 transition-transform duration-200
          `}
        >
          BUY $WANKR
        </a>
      </div>
      
      {/* Twitter handle with X logo - reduced margin */}
      <div className="text-sm text-muted-foreground font-medium mb-2">
        <a 
          href="https://x.com/wankergyatt"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 hover:text-foreground transition-colors duration-200"
        >
          <svg 
            className="w-4 h-4 fill-current" 
            viewBox="0 0 24 24" 
            aria-hidden="true"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span>@wankergyatt</span>
        </a>
      </div>
    </header>
  )
}
