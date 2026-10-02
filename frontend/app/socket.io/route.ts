import { NextRequest } from "next/server";

const DEFAULT_BACKEND_ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://nexurity-backend.onrender.com"
    : "http://localhost:5000";

const isLocalhostOrigin = (value: string) => {
  try {
    const { hostname } = new URL(value);
    return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname);
  } catch {
    return false;
  }
};

const getBackendOrigin = () => {
  const configuredOrigin =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "";

  if (
    process.env.NODE_ENV === "production" &&
    configuredOrigin &&
    isLocalhostOrigin(configuredOrigin)
  ) {
    return DEFAULT_BACKEND_ORIGIN;
  }

  return configuredOrigin || DEFAULT_BACKEND_ORIGIN;
};

const BACKEND_ORIGIN =
  getBackendOrigin();

const backendBaseUrl = BACKEND_ORIGIN.trim().replace(/\/+$/, "").replace(/\/api$/i, "");

const hopByHopHeaders = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "origin",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const buildForwardHeaders = (request: NextRequest) => {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
};

const buildResponseHeaders = (backendHeaders: Headers) => {
  const headers = new Headers();

  backendHeaders.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  headers.set("Cache-Control", "no-store");
  return headers;
};

const proxySocketIoPolling = async (request: NextRequest) => {
  const sourceUrl = new URL(request.url);
  const backendUrl = `${backendBaseUrl}/socket.io/${sourceUrl.search}`;
  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const response = await fetch(backendUrl, {
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    headers: buildForwardHeaders(request),
    method,
    redirect: "manual",
  });

  return new Response(response.body, {
    headers: buildResponseHeaders(response.headers),
    status: response.status,
    statusText: response.statusText,
  });
};

export const dynamic = "force-dynamic";

export const GET = proxySocketIoPolling;
export const POST = proxySocketIoPolling;
