// Signup.js
import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const [name, setName] = useState(""); // Remove if your backend doesn't require a name
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://172.20.87.15:5000/api/auth/register",
        {
          name, // Remove this field if not required by your backend
          email,
          password,
        }
      );
      setMessage(res.data.message);
      setTimeout(() => navigate("/"), 1000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Signup for ChatApp</h1>
        <form onSubmit={handleSignup} style={styles.form}>
          {/* If your backend doesn't use name, you can remove this field */}
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Signup
          </button>
        </form>
        <p style={styles.message}>{message}</p>
        <p style={styles.linkText}>
          Already have an account?{" "}
          <Link to="/" style={styles.link}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#222",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#333",
    padding: "40px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
    textAlign: "center",
    width: "340px",
    color: "#fff",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "20px",
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
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#3498db",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
  },
  message: {
    marginTop: "15px",
    fontSize: "16px",
  },
  linkText: {
    marginTop: "15px",
    fontSize: "14px",
  },
  link: {
    color: "#3498db",
    textDecoration: "none",
  },
};

export default Signup;
