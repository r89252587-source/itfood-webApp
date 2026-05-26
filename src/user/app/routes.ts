import { createBrowserRouter } from "react-router";
import { LandingScreen } from "@/app/screens/LandingScreen";
import { LoginScreen } from "@/app/screens/LoginScreen";
import { RestaurantListScreen } from "@/app/screens/RestaurantListScreen";
import { MenuScreen } from "@/app/screens/MenuScreen";
import { CartScreen } from "@/app/screens/CartScreen";
import { PreOrderDetailsScreen } from "@/app/screens/PreOrderDetailsScreen";
import { TakeawayDetailsScreen } from "@/app/screens/TakeawayDetailsScreen";
import { DineInDetailsScreen } from "@/app/screens/DineInDetailsScreen";
import { OrderConfirmationScreen } from "@/app/screens/OrderConfirmationScreen";
import { OrderListScreen } from "@/app/screens/OrderListScreen";
import { OrderStatusScreen } from "@/app/screens/OrderStatusScreen";
import { ProfileScreen } from "@/app/screens/ProfileScreen";
import { CompleteProfileScreen } from "@/app/screens/CompleteProfileScreen";
import { QRScanScreen } from "@/app/screens/QRScanScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingScreen,
  },
  {
    path: "/login",
    Component: LoginScreen,
  },
  {
    path: "/restaurants",
    Component: RestaurantListScreen,
  },
  {
    path: "/menu/:restaurantId",
    Component: MenuScreen,
  },
  {
    path: "/restaurant/:restaurantId",
    Component: MenuScreen,
  },
  {
    path: "/cart",
    Component: CartScreen,
  },
  {
    path: "/pre-order-details",
    Component: PreOrderDetailsScreen,
  },
  {
    path: "/takeaway-details",
    Component: TakeawayDetailsScreen,
  },
  {
    path: "/dine-in-details",
    Component: DineInDetailsScreen,
  },
  {
    path: "/order-confirmation",
    Component: OrderConfirmationScreen,
  },
  {
    path: "/order-status",
    Component: OrderListScreen,
  },
  {
    path: "/order-status/:orderId",
    Component: OrderStatusScreen,
  },
  {
    path: "/profile",
    Component: ProfileScreen,
  },
  {
    path: "/complete-profile",
    Component: CompleteProfileScreen,
  },
  {
    path: "/qr/:qrId",
    Component: QRScanScreen,
  },
]);
