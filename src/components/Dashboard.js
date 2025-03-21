// Dashboard.js
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Retrieve current user from localStorage or default to "You"
const storedUser = localStorage.getItem("user");
const currentUser = storedUser ? JSON.parse(storedUser) : "You";

// Initialize the Socket.IO client (only once)
const socket = io("http://localhost:5000");

const Dashboard = () => {
  const [contacts] = useState([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
  ]);
  const [groups] = useState([
    { id: "group1", name: "Group Chat 1" },
    { id: "group2", name: "Group Chat 2" },
  ]);
  // false: private chat; true: group chat
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // active contact or group
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [readReceipt, setReadReceipt] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Emit identity on mount
  useEffect(() => {
    socket.emit("identify", currentUser);
  }, []);

  // Listen for onlineUsers (for private chat)
  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
      console.log("Online Users:", users);
    });
    return () => {
      socket.off("onlineUsers");
    };
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Listen for incoming messages (private vs group)
  useEffect(() => {
    if (isGroupChat) {
      socket.on("receiveGroupMessage", (data) => {
        if (activeChat && data.groupId === activeChat.id) {
          setMessages((prev) => [...prev, data]);
        }
      });
      return () => {
        socket.off("receiveGroupMessage");
      };
    } else {
      socket.on("receiveMessage", (data) => {
        if (
          activeChat &&
          (data.sender === activeChat.name || data.receiver === activeChat.name)
        ) {
          setMessages((prev) => [...prev, data]);
        }
      });
      return () => {
        socket.off("receiveMessage");
      };
    }
  }, [activeChat, isGroupChat]);

  // Listen for typing events (only for private chat)
  useEffect(() => {
    socket.on("typing", (data) => {
      if (
        activeChat &&
        !isGroupChat &&
        data.sender !== currentUser &&
        data.sender === activeChat.name
      ) {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
      }
    });
    return () => {
      socket.off("typing");
    };
  }, [activeChat, isGroupChat]);

  // Listen for read receipts (only for private chat)
  useEffect(() => {
    socket.on("readReceipt", (data) => {
      if (
        !isGroupChat &&
        activeChat &&
        data.sender === activeChat.name &&
        data.receiver === currentUser
      ) {
        setReadReceipt(true);
        setTimeout(() => setReadReceipt(false), 3000);
      }
    });
    return () => {
      socket.off("readReceipt");
    };
  }, [activeChat, isGroupChat]);

  // When active chat changes, join the room and load chat history
  useEffect(() => {
    if (activeChat) {
      localStorage.setItem("activeChat", JSON.stringify(activeChat));
      if (isGroupChat) {
        socket.emit("joinGroup", { groupId: activeChat.id, user: currentUser });
        axios
          .get("http://localhost:5000/api/groupMessages", {
            params: { groupId: activeChat.id },
          })
          .then((res) => setMessages(res.data.messages))
          .catch((err) => {
            console.error("Error fetching group chat history:", err);
            setMessages([]);
          });
      } else {
        socket.emit("joinRoom", {
          sender: currentUser,
          receiver: activeChat.name,
        });
        axios
          .get("http://localhost:5000/api/messages", {
            params: { sender: currentUser, receiver: activeChat.name },
          })
          .then((res) => {
            setMessages(res.data.messages);
            // Mark messages as read
            socket.emit("markAsRead", {
              sender: currentUser,
              receiver: activeChat.name,
            });
          })
          .catch((err) => {
            console.error("Error fetching chat history:", err);
            setMessages([]);
          });
      }
    }
  }, [activeChat, isGroupChat]);

  // On mount, load stored active chat if available
  useEffect(() => {
    const storedChat = localStorage.getItem("activeChat");
    if (storedChat) {
      setActiveChat(JSON.parse(storedChat));
    }
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeChat");
    navigate("/");
  };

  // Toggle chat mode (private vs group)
  const handleToggleChatMode = () => {
    setIsGroupChat(!isGroupChat);
    setActiveChat(null);
    setMessages([]);
  };

  // When a chat (contact or group) is selected
  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setMessages([]);
  };

  // Handle input change and emit typing event (for private chat)
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!isGroupChat && activeChat) {
      socket.emit("typing", { sender: currentUser, receiver: activeChat.name });
    }
  };

  // Send message handler
  const handleSend = () => {
    if (input.trim() === "") return;
    const newMessage = {
      sender: currentUser,
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    if (isGroupChat) {
      newMessage.groupId = activeChat.id;
      socket.emit("sendGroupMessage", newMessage);
    } else {
      newMessage.receiver = activeChat.name;
      socket.emit("sendMessage", newMessage);
    }
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Chats</h2>
        </div>
        <button style={styles.modeToggleButton} onClick={handleToggleChatMode}>
          {isGroupChat ? "Private Chat" : "Group Chat"}
        </button>
        {isGroupChat
          ? groups.map((group) => (
              <div
                key={group.id}
                style={
                  activeChat && activeChat.id === group.id
                    ? styles.activeContact
                    : styles.contact
                }
                onClick={() => handleSelectChat(group)}>
                {group.name}
              </div>
            ))
          : contacts.map((contact) => (
              <div
                key={contact.id}
                style={
                  activeChat && activeChat.id === contact.id
                    ? styles.activeContact
                    : styles.contact
                }
                onClick={() => handleSelectChat(contact)}>
                <span>{contact.name}</span>
                {contact.name !== currentUser &&
                  onlineUsers.includes(contact.name) && (
                    <span style={styles.onlineIndicator}></span>
                  )}
              </div>
            ))}
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        {activeChat ? (
          <>
            <div style={styles.chatHeader}>
              <h3 style={styles.chatTitle}>
                {isGroupChat ? activeChat.name : `Chat with ${activeChat.name}`}
              </h3>
            </div>
            <div style={styles.messagesContainer}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={
                    msg.sender === currentUser
                      ? styles.myMessage
                      : styles.theirMessage
                  }>
                  <p style={styles.messageText}>{msg.text}</p>
                  <span style={styles.messageTime}>{msg.time}</span>
                </div>
              ))}
              {/* Show typing indicator (only for private chat) */}
              {!isGroupChat && typing && (
                <div style={styles.typingIndicator}>
                  <em>{activeChat.name} is typing...</em>
                </div>
              )}
              {/* Show read receipt if applicable (private chat only) */}
              {!isGroupChat && readReceipt && (
                <div style={styles.readReceipt}>
                  <em>Seen</em>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div style={styles.inputContainer}>
              <input
                style={styles.input}
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
              />
              <button style={styles.sendButton} onClick={handleSend}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={styles.noChatSelected}>
            <p style={styles.noChatText}>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: "linear-gradient(135deg, #f0f4f8, #d9e2ec)",
  },
  sidebar: {
    width: "300px",
    backgroundColor: "#2c3e50",
    color: "#ecf0f1",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
  },
  sidebarHeader: {
    marginBottom: "20px",
    textAlign: "center",
  },
  sidebarTitle: {
    fontSize: "26px",
    margin: 0,
    letterSpacing: "1px",
  },
  modeToggleButton: {
    padding: "10px",
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    marginBottom: "20px",
    cursor: "pointer",
    fontSize: "16px",
  },
  contact: {
    position: "relative",
    padding: "12px 10px",
    marginBottom: "10px",
    cursor: "pointer",
    borderRadius: "6px",
    transition: "background-color 0.3s",
  },
  activeContact: {
    position: "relative",
    padding: "12px 10px",
    marginBottom: "10px",
    cursor: "pointer",
    backgroundColor: "#34495e",
    borderRadius: "6px",
    transition: "background-color 0.3s",
  },
  onlineIndicator: {
    position: "absolute",
    top: "50%",
    right: "12px",
    transform: "translateY(-50%)",
    width: "10px",
    height: "10px",
    backgroundColor: "#2ecc71",
    borderRadius: "50%",
  },
  logoutButton: {
    marginTop: "auto",
    padding: "10px",
    backgroundColor: "#e74c3c",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    borderRadius: "6px",
    fontSize: "16px",
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ecf0f1",
  },
  chatHeader: {
    padding: "18px",
    backgroundColor: "#3498db",
    color: "#fff",
    textAlign: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  chatTitle: {
    margin: 0,
    fontSize: "22px",
  },
  messagesContainer: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    backgroundColor: "#d9e2ec",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2ecc71",
    color: "#fff",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "10px",
    maxWidth: "70%",
    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    color: "#333",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "10px",
    maxWidth: "70%",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  messageText: {
    margin: 0,
    fontSize: "16px",
  },
  messageTime: {
    fontSize: "12px",
    textAlign: "right",
    marginTop: "4px",
    color: "#555",
  },
  typingIndicator: {
    fontStyle: "italic",
    color: "#555",
    marginBottom: "10px",
    fontSize: "14px",
  },
  readReceipt: {
    fontSize: "12px",
    textAlign: "right",
    marginTop: "4px",
    color: "#2ecc71",
  },
  inputContainer: {
    display: "flex",
    padding: "12px",
    borderTop: "1px solid #ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    outline: "none",
    transition: "border-color 0.3s",
  },
  sendButton: {
    marginLeft: "10px",
    padding: "12px 24px",
    fontSize: "16px",
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  noChatSelected: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    color: "#7f8c8d",
  },
};

export default Dashboard;
