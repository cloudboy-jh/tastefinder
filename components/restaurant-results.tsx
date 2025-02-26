"use client";

import { ExternalLink, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Restaurant } from "@/lib/types";
import Image from "next/image";

interface RestaurantResultsProps {
  restaurants: Restaurant[];
}

export function RestaurantResults({ restaurants }: RestaurantResultsProps) {
  if (restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No restaurants found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or location
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12 px-4 md:px-0">
      <h2 className="text-3xl font-bold mb-8">Top Recommendations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="restaurant-card bg-card rounded-xl shadow-md overflow-hidden"
          >
            <div className="relative h-56 w-full overflow-hidden">
              <Image
                src={restaurant.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000"}
                alt={restaurant.name}
                fill
                className="object-cover restaurant-image"
              />
            </div>
            <div className="p-6 space-y-4">
              <h3 className="text-2xl font-bold line-clamp-1">{restaurant.name}</h3>
              
              <div className="flex items-center">
                <div className="flex mr-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(restaurant.rating)
                          ? "text-yellow-500 fill-yellow-500"
                          : i < restaurant.rating
                          ? "text-yellow-500 fill-yellow-500 opacity-50"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({restaurant.review_count} reviews)
                </span>
              </div>
              
              <div className="flex items-start space-x-1">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-sm text-muted-foreground line-clamp-2">
                  {restaurant.location.address1}, {restaurant.location.city}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-1">
                {restaurant.categories.map((category) => (
                  <Badge key={category.alias} variant="outline" className="bg-secondary/50">
                    {category.title}
                  </Badge>
                ))}
              </div>
              
              <Button
                className="w-full mt-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                variant="outline"
                onClick={() => window.open(restaurant.url, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" /> View on Yelp
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}