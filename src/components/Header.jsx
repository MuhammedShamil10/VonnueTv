import React from "react";

export default function Header({ dateTime }) {
  return (
    <header className="w-full bg-[#1e293b] text-white flex justify-between items-center px-8 py-3 shadow-lg">
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-bold">Vonnue</h1>
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
  );
}
