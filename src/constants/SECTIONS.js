  
  const baseUrl = "http://localhost:3001";

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
      extraUrl: `${baseUrl}/api/event-details`, // 👈 dynamic extra API
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

  export const API_BASE = baseUrl;
  export default SECTIONS;