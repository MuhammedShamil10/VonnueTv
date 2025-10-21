// src/components/Carousel.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueries } from "@tanstack/react-query";

import SECTIONS from "../constants/SECTIONS";
import { fetchJson } from "../services/api";
import useClock from "../hooks/useClock";
import Header from "./Header";
import Card from "./Card";

function formatData(rows) {
  if (!rows || rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) =>
    headers.reduce((obj, key, idx) => {
      obj[key] = row[idx] ?? "";
      return obj;
    }, {})
  );
}

export default function Carousel() {
  const [screenIndex, setScreenIndex] = useState(0);
  const dateTime = useClock(1000);

  // queries
  const queries = useQueries({
    queries: SECTIONS.map((s) => ({
      queryKey: [s.key],
      queryFn: async () => {
        const data = await fetchJson(s.url);
        let mainData = s.key === "media" ? data : formatData(data);

        if (s.extraUrl) {
          const extra = await fetchJson(s.extraUrl);
          const formattedExtra = formatData(extra).map((d) => ({
            ...d,
            _type: "eventDetail",
          }));
          mainData = [...mainData, ...formattedExtra];
        }
        return mainData;
      },
      staleTime: 60000,
      refetchInterval: 60000,
    })),
  });

  const active = SECTIONS[screenIndex];
  const activeQuery = queries[screenIndex];
  const items = activeQuery?.data || [];

  // Auto-slide using durations for media
  useEffect(() => {
    let intervalTime = 10000;
    if (active.type === "media" && items.length) {
      const maxDuration =
        Math.max(...items.map((i) => i.durationSeconds || 10)) * 1000;
      intervalTime = Math.max(10000, maxDuration);
    }

    const timer = setTimeout(() => {
      setScreenIndex((prev) => (prev + 1) % SECTIONS.length);
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [screenIndex, active.type, items]);

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      <Header dateTime={dateTime} />

      <AnimatePresence mode="wait">
        <motion.div
          key={screenIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.8 }}
          className={`flex-1 w-full bg-gradient-to-br ${active.theme} flex flex-col items-center px-6 py-6`}
        >
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg mb-6">
            {active.title}
          </h1>

          {activeQuery?.isLoading ? (
            <p className="text-white text-lg">⏳ Loading...</p>
          ) : activeQuery?.isError ? (
            <p className="text-white text-lg">❌ Error loading data</p>
          ) : items.length === 0 ? (
            <p className="text-white text-lg opacity-80">🚫 No updates</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-6 w-full max-w-7xl overflow-hidden">
              {items.map((item, index) => (
                <Card key={item.id || index} type={item._type || active.type} item={item} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
