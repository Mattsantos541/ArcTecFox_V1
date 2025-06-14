import React, { createContext, useContext, useState } from "react";

const NotifierContext = createContext(null);

export function NotifierProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const remove = (id) =>
    setMessages((msgs) => msgs.filter((m) => m.id !== id));

  const notify = (text, type = "info", duration = 3000) => {
    const id = Date.now();
    setMessages((msgs) => [...msgs, { id, text, type }]);
    setTimeout(() => remove(id), duration);
  };

  const notifySuccess = (text) => notify(text, "success");
  const notifyError = (text) => notify(text, "error");

  return (
    <NotifierContext.Provider value={{ notifySuccess, notifyError }}>
      {children}
      <div className="toast toast-end">
        {messages.map((m) => (
          <div key={m.id} className={`alert alert-${m.type}`}>
            <span>{m.text}</span>
          </div>
        ))}
      </div>
    </NotifierContext.Provider>
  );
}

export function useNotifier() {
  const ctx = useContext(NotifierContext);
  if (!ctx) throw new Error("useNotifier must be used within NotifierProvider");
  return ctx;
}
