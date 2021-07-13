import axios from 'axios';

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}`,
});

export const vercelApi = axios.create({
  baseURL: `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`,
});
