export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Welcome to <span className="text-[hsl(var(--primary))]">DEXTRACTION</span>
        </h1>
        
        <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-lg mx-auto">
          A full-stack, Solana-based Decentralized Exchange with Yield Farming, 
          Cross-Chain Stablecoin Deposits, and Lending functionality.
        </p>
        
        <div className="pt-6">
          <div className="bg-card/80 backdrop-blur-md rounded-xl border border-border p-8 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-[hsl(var(--primary))]/20 rounded-full flex items-center justify-center mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[hsl(var(--primary))]"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m4.93 4.93 14.14 14.14"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
            <p className="text-[hsl(var(--muted-foreground))] text-center max-w-sm">
              To start using DEXTRACTION, connect your Solana wallet by clicking 
              the "Connect Wallet" button in the navbar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}