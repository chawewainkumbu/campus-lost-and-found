const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const bcrypt = require("bcrypt");
const readline = require("readline");
const pool = require("./config/database");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function resetPassword() {
    try {
        const [users] = await pool.execute(
            "SELECT id, role FROM users WHERE email = ?",
            ["admin@unza.test"]
        );

        if (users.length === 0 || users[0].role !== "admin") {
            console.log("Administrator account not found. No changes made.");
            return;
        }

        rl.question("Enter a new administrator password: ", async (password) => {
            try {
                if (!password || password.length < 12) {
                    console.log("Use a password of at least 12 characters.");
                    return;
                }

                const hash = await bcrypt.hash(password, 12);

                const [result] = await pool.execute(
                    `UPDATE users
                     SET password = ?
                     WHERE id = ? AND email = ? AND role = 'admin'`,
                    [hash, users[0].id, "admin@unza.test"]
                );

                if (result.affectedRows === 1) {
                    console.log("Administrator password reset successfully.");
                } else {
                    console.log("Password was not changed. Please try again.");
                }
            } catch (error) {
                console.error("Password reset failed:", error.message);
            } finally {
                rl.close();
                await pool.end();
            }
        });
    } catch (error) {
        console.error("Password reset failed:", error.message);
        rl.close();
        await pool.end();
    }
}

resetPassword();