// src/components/Card.jsx
import React, { useState } from "react";
import placeholder from "../assets/vonnueIcon.png";
import { baseUrl } from "../services/api";

export default function Card({ type, item }) {
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
        <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-black/50">
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
      </div>
    );
  }

  if (type === "eventDetail") {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl text-white flex flex-col p-6 min-w-[20rem] max-w-[24rem]">
        <h2 className="text-2xl font-bold mb-2">{item["Event name"]}</h2>

        {item["Date"] && (
          <p className="text-sm text-gray-200 mb-1">
            📅 {new Date(item["Date"]).toLocaleDateString()}
          </p>
        )}

        {item["Event description"] && (
          <p className="text-sm opacity-90 mt-2">{item["Event description"]}</p>
        )}
      </div>
    );
  }

  // generic news/other card
  return (
    <div className={`${baseClasses} p-6`}>
      <h2 className="text-xl font-bold mb-2">{item.Title}</h2>
      {item.Subtitle && (
        <h3 className="text-md mb-2 text-gray-200">{item.Subtitle}</h3>
      )}
      {item.Description && <p className="text-sm opacity-90">{item.Description}</p>}
      {item.url && (
        <img
          src={item.url}
          alt={item.Title}
          className="w-full h-32 object-contain rounded-lg mt-3"
          loading="lazy"
        />
      )}
      {item.Date && (
        <span className="text-xs text-gray-200 mt-2 block">
          {new Date(item.Date).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
