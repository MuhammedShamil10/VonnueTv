import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Carousel() {
  const [screenIndex, setScreenIndex] = useState(0);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.BACKEND_URL || `http://43.205.253.137`;

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

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const results = await Promise.all(
          SECTIONS.map((s) =>
            fetch(s.url)
              .then((res) => res.json())
              .catch(() => [])
          )
        );

        const formatted = {};
        SECTIONS.forEach((s, i) => {
          if (s.key === "media") {
            // API already returns JSON objects
            formatted[s.key] = results[i];
          } else {
            formatted[s.key] = formatData(results[i]);
          }
        });

        setData(formatted);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching:", err);
        setLoading(false);
      }
    };

    fetchAll();
  }, []); // fetch only once

  useEffect(() => {
    const t = setInterval(() => {
      setScreenIndex((prev) => (prev + 1) % SECTIONS.length);
    }, 10000); // change every 10s (adjust for TV view)
    return () => clearInterval(t);
  }, [SECTIONS.length]);

  const active = SECTIONS[screenIndex];
  const items = data[active.key] || [];

  // console.log(data);

  return (
    <div className="w-full h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={screenIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.8 }}
          className={`min-h-screen w-full bg-gradient-to-br ${active.theme} flex flex-col items-center px-6 py-10`}
        >
          {/* Section Title */}
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mb-8">
            {active.title}
          </h1>

          {/* Loader / Empty */}
          {loading ? (
            <p className="text-white text-lg">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-white text-lg opacity-80">
              🚫 No updates currently
            </p>
          ) : (
            <div className="w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item, index) => (
                <Card key={index} type={active.type} item={item} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------- Reusable Card Component ------------------- */
function Card({ type, item }) {
  // Employee card
  if (type === "employee") {
    return (
      <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl text-white flex flex-col w-80 h-72">
        {item["Employee image url"] && (
          <img
            src={item["Employee image url"]}
            alt={item["Employee name"]}
            className="w-full h-40 object-cover rounded-lg mb-4"
          />
        )}
        <h2 className="text-xl font-bold mb-2 truncate">
          {item["Employee name"]}
        </h2>
        <p className="text-sm opacity-90 line-clamp-2">
          {item["Employee detail"]}
        </p>
        {item.Date && (
          <span className="absolute bottom-3 right-3 text-xs text-gray-200">
            {new Date(item.Date).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }

  // Media card (video + images)
  if (type === "media") {
    const isVideo = item.type === "video" || item.url?.endsWith(".mp4");

    return (
      <div
        className={`relative bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl text-white flex flex-col ${
          isVideo ? "w-[28rem] h-[22rem]" : "w-80 h-72"
        }`}
      >
        {isVideo ? (
          <video
            src={item.url}
            autoPlay
            loop
            muted
            className="w-full h-48 object-cover rounded-t-2xl"
          />
        ) : (
          <img
            src={item.url}
            alt={item.name}
            className="w-full h-40 object-cover rounded-t-2xl"
            loading="lazy"
          />
        )}

        <div className="p-4 flex-1 overflow-hidden">
          <h2 className="text-lg font-bold truncate">{item.name}</h2>
          {item.durationSeconds && (
            <p className="text-sm opacity-90">
              ⏱ Duration: {item.durationSeconds}s
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default (news cards: business/corp)
  return (
    <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl text-white flex flex-col w-80 h-72">
      <h2 className="text-xl font-bold mb-2 truncate">{item.Title}</h2>
      {item.Subtitle && (
        <h3 className="text-md mb-2 truncate">{item.Subtitle}</h3>
      )}
      {item.Description && (
        <p className="text-sm opacity-90 line-clamp-2">{item.Description}</p>
      )}
      {item.URL && (
        <img
          src={item.URL}
          alt={item.Title}
          className="w-full h-32 object-cover rounded-lg mt-3"
          loading="lazy"
        />
      )}
      {item.Date && (
        <span className="absolute bottom-3 right-3 text-xs text-gray-200">
          {new Date(item.Date).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
