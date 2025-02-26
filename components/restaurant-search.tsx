"use client";

import { useState, useRef } from "react";
import { Search, Bot, Loader2, MessageSquare, X, Send, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { RestaurantResults } from "@/components/restaurant-results";
import { Restaurant, QueryParams, ChatMessage } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function RestaurantSearch() {
  const [food, setFood] = useState("");
  const [location, setLocation] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I can help you find restaurants. Try something like 'Find me spicy food in Chicago' or 'Italian restaurants in New York open now'"
    }
  ]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!food || !location) {
      setError("Please enter both food preference and location");
      return;
    }

    await fetchRestaurants({
      food,
      location
    });
  };

  const fetchRestaurants = async (params: QueryParams) => {
    setIsLoading(true);
    setError("");
    setHasSearched(true);
    
    // Update the form fields if coming from chat
    if (params.food !== food) setFood(params.food);
    if (params.location !== location) setLocation(params.location);
    
    try {
      let url = `/api/restaurants?food=${encodeURIComponent(params.food)}&location=${encodeURIComponent(params.location)}`;
      
      // Add optional parameters if they exist
      if (params.price) url += `&price=${encodeURIComponent(params.price)}`;
      if (params.open_now) url += `&open_now=true`;
      if (params.radius) url += `&radius=${params.radius}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch restaurants");
      }
      
      const data = await response.json();
      setRestaurants(data.businesses || []);
    } catch (err) {
      setError("Failed to fetch restaurants. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      // Add user message to the chat history
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [userMessage],
        }),
      });

      if (!chatResponse.ok) {
        throw new Error("Failed to get response from chat API");
      }

      const data = await chatResponse.json();
      
      // Parse the AI response to extract structured data
      let parsedResponse: QueryParams | null = null;
      try {
        const content = data.choices[0].message.content;
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse AI response:", e);
      }

      // Add AI response to chat
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.choices[0].message.content
      };
      setMessages(prev => [...prev, assistantMessage]);

      // If we successfully parsed the response, trigger a search
      if (parsedResponse && parsedResponse.food && parsedResponse.location) {
        await fetchRestaurants({
          food: parsedResponse.food,
          location: parsedResponse.location,
          price: parsedResponse.price,
          open_now: parsedResponse.open_now
        });
      }
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const toggleChatMode = () => {
    setChatMode(!chatMode);
    // Scroll to bottom of chat when opening
    if (!chatMode) {
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 100);
    }
  };

  const restartChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I can help you find restaurants. Try something like 'Find me spicy food in Chicago' or 'Italian restaurants in New York open now'"
      }
    ]);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center items-center relative">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={toggleChatMode}
              >
                <Bot className="mr-2 h-5 w-5" /> Ask Taster
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Use AI to find restaurants</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="absolute right-0">
          <ThemeToggle />
        </div>
      </div>
      
      <div className="search-container bg-white dark:bg-card border-2 border-primary rounded-xl overflow-hidden max-w-3xl mx-auto">
        {!chatMode ? (
          <div className="flex items-center justify-between">
            <form onSubmit={handleSearch} className="flex flex-1 sm:flex-row">
              <div className="flex-1">
                <Input
                  className="bg-transparent text-foreground placeholder:text-muted-foreground border-none h-16 text-lg px-6 rounded-none focus-visible:ring-0 w-full"
                  placeholder="Restaurant, food, drinks"
                  value={food}
                  onChange={(e) => setFood(e.target.value)}
                />
              </div>
              
              <div className="hidden sm:block w-0.5 h-16 bg-primary self-center" />
              
              <div className="flex-1">
                <Input
                  className="bg-transparent text-foreground placeholder:text-muted-foreground border-none h-16 text-lg px-6 rounded-none focus-visible:ring-0 w-full"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              
              <Button 
                type="submit" 
                className="h-16 px-8 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-medium rounded-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Searching..."
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" /> Search
                  </>
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center justify-between p-3 bg-primary/10 border-b border-primary/20">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Ask Taster</h3>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={restartChat}
                        className="h-8 w-8 text-primary hover:text-primary-foreground hover:bg-primary"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Restart chat</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleChatMode}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-[250px] p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-2 max-w-[80%] rounded-lg p-3",
                      message.role === "user"
                        ? "ml-auto bg-primary/10 text-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {message.role === "user" ? null : (
                      <Bot className="h-5 w-5 mt-1 text-primary" />
                    )}
                    <div className="text-sm">{message.content}</div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex items-start gap-2 max-w-[80%] rounded-lg p-3 bg-muted text-foreground">
                    <Bot className="h-5 w-5 mt-1 text-primary" />
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about restaurants..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  disabled={chatLoading || isLoading}
                  className="bg-background"
                />
                <Button 
                  onClick={handleChatSend} 
                  disabled={chatLoading || isLoading || !chatInput.trim()}
                  size="icon"
                  className="bg-primary hover:bg-primary/90"
                >
                  {chatLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md max-w-3xl mx-auto">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl shadow-md overflow-hidden">
              <Skeleton className="h-56 w-full" />
              <div className="p-6 space-y-4">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && hasSearched && (
        <RestaurantResults restaurants={restaurants} />
      )}
    </div>
  );
}