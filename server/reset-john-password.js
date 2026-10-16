const path = require("path");

// Load environment variables from server/.env
require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const bcrypt = require("bcrypt");
const db = require("./config/database");

async function resetJohnPassword() {
  const email = "john@example.com";

  // Replace this with the new password you want John to use.
  const newPassword = "John@UNZA2026!";

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const [result] = await db.execute(
      `UPDATE users
       SET password = ?
       WHERE email = ? AND id = 1`,
      [hashedPassword, email]
    );

    if (result.affectedRows === 0) {
      console.log("No matching John Banda account was found.");
      return;
    }

    console.log("John's password has been reset successfully.");
    console.log("Email:", email);
    console.log("Use the new password you configured in the script.");
  } catch (error) {
    console.error("Password reset failed:", error.message);
  } finally {
    if (typeof db.end === "function") {
      await db.end();
    }
  }
}

resetJohnPassword();