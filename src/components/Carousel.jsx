import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueries } from "@tanstack/react-query";
import placeholder from "../assets/vonnueIcon.png";

const baseUrl = "http://127.0.0.1:3001";

export default function Carousel() {
  const [screenIndex, setScreenIndex] = useState(0);
  const [dateTime, setDateTime] = useState(new Date());


  const SECTIONS = [
    {
      key: "businessNews",
      title: "📊 Business Updates",
      url: `${baseUrl}/api/business-news`,
      theme: "from-[#0E3B43] to-[#415a77]",
      type: "news",
    },
    {
      key: "corpNews",
      title: "🏢 Office / Corporate",
      url: `${baseUrl}/api/corp-news`,
      theme: "from-[#216869] to-[#6e68a1]",
      type: "news",
    },
    {
      key: "media",
      title: "🎥 Media & Events",
      url: `${baseUrl}/api/event-media`,
      theme: "from-[#677DB7] to-[#415a77]",
      type: "media",
    },
    {
      key: "employees",
      title: "👥 Employee Highlights",
      url: `${baseUrl}/api/employees`,
      theme: "from-[#0E3B43] to-[#216869]",
      type: "employee",
    },
  ];

  const formatData = (rows) => {
    if (!rows || rows.length === 0) return [];
    const headers = rows[0];
    return rows.slice(1).map((row) =>
      headers.reduce((obj, key, idx) => {
        obj[key] = row[idx] ?? "";
        return obj;
      }, {})
    );
  };

  const queries = useQueries({
    queries: SECTIONS.map((s) => ({
      queryKey: [s.key],
      queryFn: async () => {
        const res = await fetch(s.url);
        const data = await res.json();
        return s.key === "media" ? data : formatData(data);
      },
      staleTime: 60000,
      refetchInterval: 60000,
    })),
  });

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const active = SECTIONS[screenIndex];
  const activeQuery = queries[screenIndex];
  const items = activeQuery?.data || [];

  /** Auto-slide logic using backend durations */
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
  }, [screenIndex, active.type, items, SECTIONS.length]);

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      {/* Header */}
      <header className="w-full bg-[#1e293b] text-white flex justify-between items-center px-8 py-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">Vonnue</h1>
          <h1 className="text-2xl font-bold">Innovations</h1>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">
            {dateTime.toLocaleTimeString("en-US", { hour12: false })}
          </div>
          <div className="text-sm opacity-80">
            {dateTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </header>

      {/* Carousel */}
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

          {activeQuery.isLoading ? (
            <p className="text-white text-lg">⏳ Loading...</p>
          ) : activeQuery.isError ? (
            <p className="text-white text-lg">❌ Error loading data</p>
          ) : items.length === 0 ? (
            <p className="text-white text-lg opacity-80">🚫 No updates</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-6 w-full max-w-7xl overflow-hidden">
              {items.map((item, index) => (
                <Card key={item.id || index} type={active.type} item={item} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------- Card ------------------- */
function Card({ type, item }) {
  const baseClasses =
    "bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl text-white flex flex-col flex-1 basis-[22rem] min-w-[18rem] max-w-[24rem]";
  const [isLoaded, setIsLoaded] = useState(false);

  if (type === "employee") {
    return (
      <div className={`${baseClasses} p-6`}>
        {item["Employee image url"] && (
          <img
            src={`${baseUrl}${item["Employee image url"]}`}
            alt={item["Employee name"]}
            className="w-full h-40 object-contain rounded-lg mb-4"
            loading="lazy"
          />
        )}
        <h2 className="text-xl font-bold mb-2">{item["Employee name"]}</h2>
        <p className="text-sm opacity-90">{item["Employee detail"]}</p>
      </div>
    );
  }

  if (type === "media") {
    const isVideo = item.type === "video" || item.url?.endsWith(".mp4");
    return (
      <div className={baseClasses}>
        <div className="relative w-full h-56 rounded-t-2xl overflow-hidden bg-black/50">
          {!isLoaded && (
            <img
              src={placeholder}
              alt="loading preview"
              className="absolute inset-0 w-full h-full object-cover animate-pulse transition-opacity duration-500"
            />
          )}
          {isVideo ? (
            <video
              src={`${baseUrl}${item.url}`}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoadedData={() => setIsLoaded(true)}
            />
          ) : (
            <img
              src={`${baseUrl}${item.url}`}
              alt={item.name}
              className="w-full h-56 object-cover rounded-t-2xl"
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
            />
          )}
        </div>
        <div className="p-4 flex-1">
          <h2 className="text-lg font-bold">{item.name}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} p-6`}>
      <h2 className="text-xl font-bold mb-2">{item.Title}</h2>
      {item.Subtitle && (
        <h3 className="text-md mb-2 text-gray-200">{item.Subtitle}</h3>
      )}
      {item.Description && (
        <p className="text-sm opacity-90">{item.Description}</p>
      )}
      {item.url && (
        <img
          src={item.url}
          alt={item.Title}
          className="w-full h-32 object-contain rounded-lg mt-3"
          loading="lazy"
        />
      )}
      {item.Date && (
        <span className="text-xs text-gray-200 mt-2">
          {new Date(item.Date).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
