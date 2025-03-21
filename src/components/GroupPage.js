// GroupsPage.js
import React from "react";
import GroupCreation from "./GroupCreation";
import Addmember from "./Addmember";

const GroupsPage = () => {
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Manage Your Groups</h2>
      <GroupCreation />
      <Addmember />
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "20px",
  },
};

export default GroupsPage;
