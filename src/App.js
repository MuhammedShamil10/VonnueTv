import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Carousel from "./components/Carousel";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Carousel />
    </QueryClientProvider>
  );
}
