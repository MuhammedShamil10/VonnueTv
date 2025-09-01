import React, { useEffect, useState } from "react";

export default function Carousel() {
  const [screenIndex, setScreenIndex] = useState(0);
  const [data, setData] = useState({});

  const SECTIONS = [
    {
      key: "businessNews",
      title: "📊 Business Updates",
      url: "http://192.168.0.243:3001/api/business-news",
      theme: "from-blue-600 to-indigo-800",
      type: "news",
    },
    {
      key: "corpNews",
      title: "🏢 Office / Corporate",
      url: "http://192.168.0.243:3001/api/corp-news",
      theme: "from-emerald-600 to-teal-800",
      type: "news",
    },
    {
      key: "media",
      title: "🎥 Media & Events",
      url: "http://192.168.0.243:3001/api/event-media",
      theme: "from-purple-600 to-pink-700",
      type: "news",
    },
    {
      key: "employees",
      title: "👥 Employee Highlights",
      url: "http://192.168.0.243:3001/api/employees",
      theme: "from-orange-600 to-red-700",
      type: "employee",
    },
  ];

  // Convert sheet rows into objects
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
        const results = await Promise.all(
          SECTIONS.map((s) =>
            fetch(s.url).then((res) => res.json()).catch(() => [])
          )
        );

        const formatted = {};
        SECTIONS.forEach((s, i) => {
          formatted[s.key] = formatData(results[i]);
        });

        setData(formatted);
      } catch (err) {
        console.error("Error fetching:", err);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setScreenIndex((prev) => (prev + 1) % SECTIONS.length);
    }, 15000);
    return () => clearInterval(t);
  }, [SECTIONS.length]);

  const active = SECTIONS[screenIndex];
  const items = data[active.key] || [];

  return (
    <div className="w-full h-screen overflow-auto">
      <div
        className={`min-h-screen w-full bg-gradient-to-br ${active.theme} flex flex-col items-center px-6 py-10`}
      >
        {/* Section Title */}
        <h1 className="text-4xl font-extrabold text-white drop-shadow-lg mb-8">
          {active.title}
        </h1>

        {/* Cards OR Empty Message */}
        {items.length === 0 ? (
          <div className="text-white text-xl font-semibold mt-20">
            No updates currently
          </div>
        ) : (
          <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item, index) => (
              <Card key={index} type={active.type} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------- Reusable Card Component ------------------- */
function Card({ type, item }) {
  if (type === "employee") {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl text-white flex flex-col">
        {item["Employee image url"] && (
          <img
            src={item["Employee image url"]}
            alt={item["Employee name"]}
            className="w-full h-40 object-cover rounded-lg mb-4"
          />
        )}
        <h2 className="text-xl font-bold mb-2">{item["Employee name"]}</h2>
        <p className="text-sm opacity-90">{item["Employee detail"]}</p>
      </div>
    );
  }

  // Default = news card
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl text-white flex flex-col">
      <h2 className="text-xl font-bold mb-2">{item.Title}</h2>
      {item.Subtitle && <h3 className="text-md mb-2">{item.Subtitle}</h3>}
      {item.Description && (
        <p className="text-sm opacity-90 mb-3">{item.Description}</p>
      )}
      {item.Date && (
        <span className="text-xs bg-black/30 px-2 py-1 rounded self-start mb-2">
          {item.Date}
        </span>
      )}
      {item.URL && <img src={item.URL} alt="" className="rounded-lg mt-2" />}
    </div>
  );
}
