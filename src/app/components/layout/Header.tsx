import Image from 'next/image'

export function Header() {
  return (
    <header className="text-center py-8 mb-8">
      <div className="flex items-center justify-center mb-4">
        <Image
          src="/wankr-logo.svg"
          alt="WANKR Logo"
          width={80}
          height={80}
          className="animate-float"
        />
      </div>
      
      <h1 className="text-6xl font-bold text-gradient-hero font-wankr mb-4">
        WANKR
      </h1>
      
      <h2 className="text-4xl font-bold text-gradient-hero font-wankr mb-6">
        Shame.
      </h2>
      
      <p className="text-xl text-foreground max-w-2xl mx-auto leading-relaxed">
        $WANKR is the world&apos;s first Shame-as-a-Service token.
      </p>
      
      <div className="flex gap-4 justify-center mt-6">
        <button className="bg-gradient-cta text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105">
          Read Whitepaper
        </button>
        <button className="border border-cyber text-cyber px-6 py-3 rounded-lg font-semibold hover:bg-cyber hover:text-white transition-all duration-300">
          BUY $WANKR
        </button>
      </div>
      
      <div className="mt-6 text-sm text-muted-foreground">
        @wankergyatt
      </div>
    </header>
  )
}
