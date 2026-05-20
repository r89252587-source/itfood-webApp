import { createContext, useContext, useState, useCallback, ReactNode } from "react";
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  portion?: "half" | "full";
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string, portion?: "half" | "full") => void;
  updateQuantity: (id: string, quantity: number, portion?: "half" | "full") => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getItemQuantity: (id: string, portion?: "half" | "full") => number;
  restaurantId: string | null;
  setRestaurantId: (id: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const addToCart = useCallback((item: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const existing = prev.find((i) =>
        i.id === item.id && i.portion === item.portion
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.portion === item.portion
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string, portion?: "half" | "full") => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.portion === portion)));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, portion?: "half" | "full") => {
    if (quantity === 0) {
      setCart((prev) => prev.filter((i) => !(i.id === id && i.portion === portion)));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === id && i.portion === portion ? { ...i, quantity } : i))
    );
  }, []);

  const getItemQuantity = useCallback((id: string, portion?: "half" | "full") => {
    const item = cart.find((i) => i.id === id && i.portion === portion);
    return item?.quantity || 0;
  }, [cart]);

  const clearCart = useCallback(() => {
    setCart([]);
    setRestaurantId(null);
  }, []);

  const getTotalPrice = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const getTotalItems = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        getItemQuantity,
        restaurantId,
        setRestaurantId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
