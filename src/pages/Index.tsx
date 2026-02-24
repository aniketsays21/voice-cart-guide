const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">ShopAI</h1>
          <p className="text-sm text-muted-foreground">Your AI Shopping Assistant</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-foreground mb-4">
          Shop Smarter with AI
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Tap the AI Assistant tab below to talk to our AI assistant. Get personalized product
          recommendations, the best discounts, and guided shopping — in English or Hindi.
        </p>
        <div className="flex justify-center gap-3">
          <span className="inline-flex items-center text-xs bg-accent text-accent-foreground rounded-full px-3 py-1.5">
            🗣️ Voice + Text
          </span>
          <span className="inline-flex items-center text-xs bg-accent text-accent-foreground rounded-full px-3 py-1.5">
            🇮🇳 English & Hindi
          </span>
          <span className="inline-flex items-center text-xs bg-accent text-accent-foreground rounded-full px-3 py-1.5">
            🏷️ Auto Discounts
          </span>
        </div>
      </main>
    </div>
  );
};

export default Index;
