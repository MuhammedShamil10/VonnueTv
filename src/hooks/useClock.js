import { useEffect, useState } from "react";

export default function useClock(tick = 1000) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), tick);
    return () => clearInterval(id);
  }, [tick]);
  return now;
}
