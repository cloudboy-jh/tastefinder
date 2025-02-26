"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, QueryParams, Restaurant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatRestaurantFinderProps {
  onSearch: (params: QueryParams) => Promise<void>;
  isLoading: boolean;
}

export function ChatRestaurantFinder({ onSearch, isLoading }: ChatRestaurantFinderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I can help you find restaurants. Tell me what you're looking for, like 'I want something spicy in New York under $20' or 'Find me Italian food in San Francisco that's open now'."
    }
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || chatLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
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
        await onSearch({
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
          content: "Sorry, I encountered an error. Please try again or use the search bar above."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const restartChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I can help you find restaurants. Tell me what you're looking for, like 'I want something spicy in New York under $20' or 'Find me Italian food in San Francisco that's open now'."
      }
    ]);
  };

  return (
    <div className="bg-card border-2 border-primary/30 rounded-xl overflow-hidden shadow-md transition-all hover:shadow-lg">
      <div className="p-4 bg-primary/10 border-b border-primary/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Ask Taster</h3>
        </div>
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
      </div>
      
      <ScrollArea className="h-[350px] p-4" ref={scrollAreaRef}>
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
              {message.role === "user" ? (
                <User className="h-5 w-5 mt-1 text-primary" />
              ) : (
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
      
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about restaurants..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={chatLoading || isLoading}
            className="bg-background"
          />
          <Button 
            onClick={handleSend} 
            disabled={chatLoading || isLoading || !input.trim()}
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
        <p className="text-xs text-muted-foreground mt-2">
          Try: "Find me spicy food in Chicago under $30" or "Italian restaurants in New York open now"
        </p>
      </div>
    </div>
  );
}