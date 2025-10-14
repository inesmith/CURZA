import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from "react";
import StatusModal from "../ui/StatusModal";

type Variant = "success" | "error";
type Ctx = { show: (msg: string, variant?: Variant, autoHideMs?: number) => void };

const NoticeCtx = createContext<Ctx>({ show: () => {} });

export const NoticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<Variant>("success");
  const [autoHideMs, setAutoHideMs] = useState<number | undefined>(2200);
  const pending = useRef<number | null>(null);

  const show = (msg: string, v: Variant = "success", ms = 2200) => {
    setMessage(msg);
    setVariant(v);
    setAutoHideMs(ms);
    // force re-open
    setVisible(false);
    // next tick for StatusModal to re-mount
    pending.current = requestAnimationFrame(() => setVisible(true));
  };

  useEffect(() => () => { if (pending.current) cancelAnimationFrame(pending.current); }, []);

  const value = useMemo(() => ({ show }), []);
  return (
    <NoticeCtx.Provider value={value}>
      {children}
      <StatusModal
        visible={visible}
        message={message}
        variant={variant}
        autoHideMs={autoHideMs}
        onClose={() => setVisible(false)}
      />
    </NoticeCtx.Provider>
  );
};

export const useNotice = () => useContext(NoticeCtx);
