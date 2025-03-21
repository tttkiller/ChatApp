// AddMember.js
import React, { useState } from "react";
import axios from "axios";

const AddMember = () => {
  const [groupId, setGroupId] = useState("");
  const [member, setMember] = useState("");
  const [message, setMessage] = useState("");

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `http://localhost:5000/api/groups/${groupId}/add`,
        {
          member,
        }
      );
      setMessage(res.data.message);
      setGroupId("");
      setMember("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to add member");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Add Member to Group</h2>
      <form onSubmit={handleAddMember} style={styles.form}>
        <input
          type="text"
          placeholder="Group ID"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Member Name"
          value={member}
          onChange={(e) => setMember(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Add Member
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

export default AddMember;
