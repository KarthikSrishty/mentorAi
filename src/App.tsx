import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import './App.css';
import { IoChatbubblesSharp, IoClose } from 'react-icons/io5'; // Import chat and close icons

interface Message {
  sender: string;
  text: string;
}

const App: React.FC = () => {
  const [question, setQuestion] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false); // Handle chat window open/close

  // Reference to the chat container for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Add user question to chat history
    const newChatHistory = [...chatHistory, { sender: "user", text: question }];
    setChatHistory(newChatHistory);
    setQuestion("");  // Clear the input

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/ask", { question });
      
      // Add bot response to chat history
      const botResponse = res.data.response.replace(/\n/g, "<br />"); // Format the response
      setChatHistory([...newChatHistory, { sender: "bot", text: botResponse }]);
    } catch (error) {
      setChatHistory([...newChatHistory, { sender: "bot", text: "Error: Unable to get a response from the server." }]);
    } finally {
      setLoading(false);
    }
  };

  // Automatically scroll to the latest message when chatHistory updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <>
      {/* Chat Icon that toggles the chat window */}
      <div className="chat-icon" onClick={() => setChatOpen(true)}>
        <IoChatbubblesSharp size={30} color="white" />
      </div>

      {/* Chat Window */}
      <div className={`chat-wrapper ${chatOpen ? 'open' : ''}`}>
        <div className="app-container">
          <div className="chat-header">
            <h1 className="app-header">MentorAI</h1>
            <button className="close-button" onClick={() => setChatOpen(false)}>
              <IoClose size={30} color="white" />
            </button>
          </div>

          {/* Chat History */}
          <div className="chat-container" ref={chatContainerRef}>
            {chatHistory.map((message, index) => (
              <div
                key={index}
                className={`chat-bubble ${message.sender === "user" ? "user-bubble" : "bot-bubble"}`}
              >
                <p
                  className="chat-text"
                  dangerouslySetInnerHTML={{ __html: message.text }}
                ></p>
              </div>
            ))}
            {loading && <div className="loading-text">Bot is typing...</div>}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="form-container">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your question here..."
              className="input-box"
              disabled={loading}
            />
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Loading..." : "Ask"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default App;
