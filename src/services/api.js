import { API_BASE } from "../constants/SECTIONS";

export const baseUrl = API_BASE;

export async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}
