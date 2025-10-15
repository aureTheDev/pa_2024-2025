"use client";
import { useState } from "react";

export default function ChatBot({ collaboratorId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chatbot/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: input,
            collaborator_id: collaboratorId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessages([...newMessages, { sender: "bot", text: data.detail }]);
        return;
      }

      setMessages([...newMessages, { sender: "bot", text: data.response }]);
    } catch (error) {
      setMessages([...newMessages, { sender: "bot", text: "Erreur serveur." }]);
    }
  };

  return (
    <div className="p-4 border rounded max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-2">🤖 Chat Collaborateur</h2>
      <div className="h-64 overflow-y-auto bg-gray-100 p-2 mb-2 rounded">
        {messages.map((msg, idx) => (
          <p
            key={idx}
            className={msg.sender === "user" ? "text-right" : "text-left"}
          >
            <strong>{msg.sender === "user" ? "Vous" : "Bot"}:</strong>{" "}
            {msg.text}
          </p>
        ))}
      </div>
      <input
        className="w-full border p-2 rounded mb-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        placeholder="Posez votre question..."
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={sendMessage}
      >
        Envoyer
      </button>
    </div>
  );
}
