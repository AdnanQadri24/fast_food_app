import { Redirect, Slot } from "expo-router";

export default function TabLayout() {
  const isAuthenticated = false;
  if (!isAuthenticated) return <Redirect href="/sign-in" />;
  return <Slot />;
}
