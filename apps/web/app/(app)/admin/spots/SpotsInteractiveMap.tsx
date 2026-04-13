"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

type SpotWithCoords = {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
};

/** Custom marker DOM: large hit area + native title + visible hover label (default SVG pins miss mouse events). */
function createMarkerElement(title: string): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.position = "relative";
  wrap.style.width = "36px";
  wrap.style.height = "36px";
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";
  wrap.style.cursor = "pointer";
  wrap.setAttribute("title", title);

  const label = document.createElement("div");
  label.textContent = title;
  label.style.cssText = [
    "position:absolute",
    "bottom:100%",
    "left:50%",
    "transform:translateX(-50%)",
    "margin-bottom:6px",
    "max-width:220px",
    "padding:4px 8px",
    "border-radius:8px",
    "font-size:11px",
    "font-weight:600",
    "line-height:1.25",
    "white-space:nowrap",
    "overflow:hidden",
    "text-overflow:ellipsis",
    "color:#fff",
    "background:rgba(9,9,23,0.92)",
    "border:1px solid rgba(99,126,255,0.35)",
    "box-shadow:0 4px 12px rgba(0,0,0,0.35)",
    "opacity:0",
    "pointer-events:none",
    "transition:opacity 0.12s ease",
    "z-index:2",
  ].join(";");

  const dot = document.createElement("div");
  dot.style.cssText = [
    "width:14px",
    "height:14px",
    "border-radius:999px",
    "background:#3D7BFF",
    "border:2px solid #fff",
    "box-shadow:0 2px 8px rgba(0,0,0,0.4)",
    "z-index:1",
  ].join(";");

  wrap.appendChild(label);
  wrap.appendChild(dot);

  wrap.addEventListener("mouseenter", () => {
    label.style.opacity = "1";
  });
  wrap.addEventListener("mouseleave", () => {
    label.style.opacity = "0";
  });

  return wrap;
}

function popupInnerHtml(s: SpotWithCoords): string {
  const title = escapeHtml(s.title);
  const addressRaw = s.address?.trim();
  const address = addressRaw ? escapeHtml(addressRaw) : "—";
  const coords = `${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}`;
  return `
    <div style="padding:14px 38px 14px 16px;min-width:200px;max-width:260px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5c96ff;margin-bottom:6px">Parking spot</div>
      <div style="font-size:15px;font-weight:600;color:#f8fafc;line-height:1.3;margin:0 0 8px;word-wrap:break-word">${title}</div>
      <div style="font-size:12px;color:#8b9fd4;line-height:1.45;margin:0 0 10px;word-wrap:break-word">${address}</div>
      <div style="display:inline-flex;align-items:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#a8b8ea;background:rgba(61,123,255,0.10);border:1px solid rgba(99,126,255,0.22);border-radius:8px;padding:7px 10px;line-height:1.3">${escapeHtml(coords)}</div>
    </div>
  `;
}

export function SpotsInteractiveMap({
  spots,
  accessToken,
}: {
  spots: SpotWithCoords[];
  accessToken: string;
}) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapElRef.current || !accessToken || spots.length === 0) return;

    mapboxgl.accessToken = accessToken;

    const center = spots[0];
    const map = new mapboxgl.Map({
      container: mapElRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lng, center.lat],
      zoom: 11,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    const allMarkers: mapboxgl.Marker[] = [];

    for (const s of spots) {
      const el = createMarkerElement(s.title);
      const popup = new mapboxgl.Popup({
        offset: 20,
        closeButton: true,
        closeOnClick: true,
        maxWidth: "min(280px, calc(100vw - 48px))",
        className: "pn-mapbox-popup",
      }).setHTML(popupInnerHtml(s));

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([s.lng, s.lat])
        .setPopup(popup)
        .addTo(map);

      allMarkers.push(marker);

      // Custom marker DOM does not always fire Mapbox’s internal toggle — open explicitly.
      el.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          for (const m of allMarkers) {
            if (m !== marker) m.getPopup()?.remove();
          }
          marker.togglePopup();
        },
        { capture: true }
      );
    }

    if (spots.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      for (const s of spots) bounds.extend([s.lng, s.lat]);
      map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [accessToken, spots]);

  return (
    <div
      ref={mapElRef}
      className="h-80 w-full min-h-[320px] min-w-0 rounded-xl border border-border-token"
    />
  );
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
