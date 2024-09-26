import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import './App.css';
import { IoChatbubblesSharp, IoClose, IoCloudUploadOutline, IoSendSharp } from 'react-icons/io5'; // Icons for upload, chat, close, send

interface Message {
  sender: string;
  text: string;
}

const App: React.FC = () => {
  const [question, setQuestion] = useState<string>(""); // Stores user input for questions
  const [chatHistory, setChatHistory] = useState<Message[]>([]); // Chat messages history
  const [loading, setLoading] = useState<boolean>(false); // Loader for the input button
  const [chatOpen, setChatOpen] = useState<boolean>(false); // Handle chat window open/close
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State for selected PDF
  const [fileSummaries, setFileSummaries] = useState<any>({}); // Store summaries for uploaded PDFs
  const [selectedFileName, setSelectedFileName] = useState<string>(""); // Selected PDF name for asking questions
  const [chatMode, setChatMode] = useState<'pdf' | 'mentor'>('pdf'); // Track whether it's PDF mode or MentorAI Chat mode

  // Reference to the chat container for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]); // Store selected file
    }
  };

  // Handle PDF upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("files", selectedFile);

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/upload_pdf", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setFileSummaries(res.data); // Store the summaries of the uploaded files
      const uploadedFileName = selectedFile.name;
      setSelectedFileName(uploadedFileName); // Set the uploaded file name to handle the question-asking functionality
    } catch (error) {
      console.error("Error uploading PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle submitting a question based on the current chat mode
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return; // Ensure question is non-empty

    // Add user question to chat history
    const newChatHistory = [...chatHistory, { sender: "user", text: question }];
    setChatHistory(newChatHistory);
    setQuestion("");  // Clear the input

    setLoading(true);

    try {
      if (chatMode === 'pdf') {
        // PDF Summarization mode
        if (!selectedFileName) return; // Ensure a file is uploaded in PDF mode

        const res = await axios.post("http://localhost:5000/ask_question", {
          file_name: selectedFileName, // Use the selected PDF's name
          question,
        });

        const botResponse = res.data.answer.replace(/\n/g, "<br />"); // Format the response
        setChatHistory([...newChatHistory, { sender: "bot", text: botResponse }]);
      } else if (chatMode === 'mentor') {
        // General AI chat (MentorAI mode)
        const res = await axios.post("http://localhost:5000/ask", {
          question,
        });

        const botResponse = res.data.response.replace(/\n/g, "<br />"); // Format the response
        setChatHistory([...newChatHistory, { sender: "bot", text: botResponse }]);
      }
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

          {/* Mode Selection */}
          <div className="chat-mode-toggle">
            <button
              className={`toggle-button ${chatMode === 'pdf' ? 'active' : ''}`}
              onClick={() => setChatMode('pdf')}
            >
              PDF Summarization
            </button>
            <button
              className={`toggle-button ${chatMode === 'mentor' ? 'active' : ''}`}
              onClick={() => setChatMode('mentor')}
            >
              MentorAI Chat
            </button>
          </div>


          {chatMode === 'pdf' && (
            <div>
              {/* File Uploader */}
              <div className="file-upload">
                <label className="file-label" htmlFor="file-upload">
                  <IoCloudUploadOutline size={24} /> Upload PDF
                </label>
                <input type="file" accept=".pdf" id="file-upload" onChange={handleFileChange} />
                <button onClick={handleUpload} disabled={loading || !selectedFile} className="upload-button">
                  {loading ? "Uploading..." : "Upload"}
                </button>
              </div>

              {/* Display PDF Summaries */}
              <div>
                {Object.keys(fileSummaries).map((fileName) => (
                  <div key={fileName} className="summary-container">
                    <h3>{fileName}</h3>
                    {/* <p>{fileSummaries[fileName].summary}</p> */}
                  </div>
                ))}
              </div>
            </div>
          )}

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
              placeholder={`Ask a question about ${chatMode === 'pdf' ? selectedFileName : 'anything'}`}
              className="input-box"
              disabled={loading || (chatMode === 'pdf' && !selectedFileName)}
            />
            <button type="submit" className="submit-button" disabled={loading || (chatMode === 'pdf' && !selectedFileName)}>
              {loading ? "Loading..." : <IoSendSharp size={24} />}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default App;
