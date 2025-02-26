import RestaurantSearch from "@/components/restaurant-search";
import { ThemeProvider } from "@/components/theme-provider";
import { Utensils } from "lucide-react";

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-6xl">
          <header className="mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Utensils className="h-10 w-10 text-primary" />
              <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Taste Finder</h1>
            </div>
            <p className="text-xl text-muted-foreground">Discover the perfect restaurant for any craving</p>
          </header>
          <RestaurantSearch />
        </div>
      </main>
    </ThemeProvider>
  );
}