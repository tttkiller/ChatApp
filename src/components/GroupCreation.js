// GroupCreation.js
import React, { useState } from "react";
import axios from "axios";

const GroupCreation = ({ onGroupCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [membersInput, setMembersInput] = useState("");
  const [message, setMessage] = useState("");

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    // Split comma-separated members and remove extra whitespace
    const members = membersInput
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m);
    try {
      const res = await axios.post("http://localhost:5000/api/groups/create", {
        name: groupName,
        members,
      });
      setMessage(res.data.message);
      if (onGroupCreated) onGroupCreated(res.data.group);
      setGroupName("");
      setMembersInput("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Group creation failed");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create a Group</h2>
      <form onSubmit={handleCreateGroup} style={styles.form}>
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Members (comma separated)"
          value={membersInput}
          onChange={(e) => setMembersInput(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Create Group
        </button>
      </form>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#333",
    color: "#fff",
    padding: "20px",
    borderRadius: "8px",
    maxWidth: "400px",
    margin: "20px auto",
    textAlign: "center",
  },
  title: {
    fontSize: "24px",
    marginBottom: "15px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "12px",
    margin: "10px 0",
    borderRadius: "5px",
    border: "none",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
  },
  message: {
    marginTop: "15px",
    fontSize: "16px",
  },
};

export default GroupCreation;
