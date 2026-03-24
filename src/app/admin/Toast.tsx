"use client";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "info";
  action?: { label: string; url: string };
}

export default function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <>
      <style>{`@keyframes toastSlideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ animation: "toastSlideIn 0.3s ease-out" }}
            className={`flex items-center gap-3 px-4 py-3 rounded-[8px] shadow-lg text-white text-[14px] font-medium ${
              t.type === "success" ? "bg-[#16a34a]" : "bg-[#1A5FAC]"
            }`}
          >
            <span>{t.message}</span>
            {t.action && (
              <a
                href={t.action.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold whitespace-nowrap"
              >
                {t.action.label}
              </a>
            )}
            <button
              onClick={() => onRemove(t.id)}
              className="ml-2 text-[18px] leading-none opacity-70 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
