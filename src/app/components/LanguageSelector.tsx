"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    __gtReady?: boolean;
  }
}

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "ja", label: "JP" },
  { code: "ko", label: "KO" },
  { code: "zh-CN", label: "ZH" },
];

export default function LanguageSelector() {
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState("en");

  useEffect(() => {
    // Inject style to hide Google Translate banner (idempotent)
    if (!document.getElementById("gt-hide-banner")) {
      const style = document.createElement("style");
      style.id = "gt-hide-banner";
      style.innerHTML = `
        .goog-te-banner-frame, iframe.skiptranslate { display: none !important; height: 0 !important; }
        body { top: 0 !important; }
      `;
      document.head.appendChild(style);
    }

    // Watch for body.style.top being set by Google
    const observer = new MutationObserver(() => {
      document.body.style.top = "0";
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    // Wait for init signal from layout
    if (window.__gtReady) {
      setReady(true);
    } else {
      window.addEventListener("gt-ready", () => setReady(true), { once: true });
    }

    return () => observer.disconnect();
  }, []);

  function switchLanguage(code: string) {
    setCurrent(code);
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  if (!ready) return null;

  return (
    <div className="flex items-center border border-white/20 rounded-lg overflow-hidden">
      {LANGUAGES.map((lang, i) => (
        <button
          key={lang.code}
          onClick={() => switchLanguage(lang.code)}
          className={`px-2.5 py-1 text-xs font-medium transition-colors ${
            i > 0 ? "border-l border-white/20" : ""
          } ${
            current === lang.code
              ? "bg-white/20 text-white"
              : "text-white/50 hover:text-white hover:bg-white/10"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
