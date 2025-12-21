import { BottomNav } from "@/components/BottomNav";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Explore() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-14 pb-4">
        <h1 className="text-3xl font-display font-bold mb-6">Explore</h1>
        
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search for anything..." 
            className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus:bg-white focus:border-primary/50"
          />
        </div>
      </header>

      <main className="px-5 mt-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { title: "Food", color: "bg-orange-100 text-orange-700" },
            { title: "Groceries", color: "bg-green-100 text-green-700" },
            { title: "Services", color: "bg-blue-100 text-blue-700" },
            { title: "Shops", color: "bg-purple-100 text-purple-700" },
            { title: "Events", color: "bg-pink-100 text-pink-700" },
            { title: "Transport", color: "bg-yellow-100 text-yellow-700" },
          ].map((cat) => (
            <div 
              key={cat.title}
              className={`${cat.color} h-32 rounded-2xl flex items-center justify-center font-bold text-lg cursor-pointer hover:opacity-90 transition-opacity`}
            >
              {cat.title}
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
