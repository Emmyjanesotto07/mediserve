/*
MIT License

Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
Mindoro State University - Philippines

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createRequire } from "module";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(__filename);

let sequelize;

// =====================================================
// DATABASE ENVIRONMENT VARIABLES
// =====================================================
// DB_* variables are prioritized because these are the
// variables we configured in Render.
//
// Railway values should be placed in Render as:
//
// DB_HOST = Railway MYSQLHOST
// DB_PORT = Railway MYSQLPORT
// DB_USER = Railway MYSQLUSER
// DB_PASS = Railway MYSQLPASSWORD
// DB_NAME = Railway MYSQLDATABASE
// =====================================================

const DB_HOST =
  process.env.DB_HOST ||
  process.env.MYSQL_HOST ||
  "localhost";

const DB_PORT =
  process.env.DB_PORT ||
  process.env.MYSQL_PORT ||
  3306;

const DB_USER =
  process.env.DB_USER ||
  process.env.MYSQL_USER ||
  "root";

const DB_PASS =
  process.env.DB_PASS ||
  process.env.MYSQL_PASSWORD ||
  "";

const DB_NAME =
  process.env.DB_NAME ||
  process.env.MYSQL_DATABASE ||
  "Mediserve";

// =====================================================
// CREATE DATABASE CONNECTION
// =====================================================

try {
  const mysql2 = require("mysql2");

  console.log("🔌 Database configuration:");
  console.log("   Host:", DB_HOST);
  console.log("   Port:", DB_PORT);
  console.log("   Database:", DB_NAME);
  console.log("   User:", DB_USER);

  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: "mysql",
    logging: false,
    dialectModule: mysql2,

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    define: {
      timestamps: true
    }
  });

} catch (err) {

  console.error("❌ Failed to initialize MySQL:", err.message);

  // Fallback connection so the application itself
  // does not immediately crash.
  sequelize = new Sequelize("mysql://localhost/temp", {
    logging: false,
    dialect: "mysql"
  });
}

export { sequelize };

// =====================================================
// TEST DATABASE CONNECTION
// =====================================================

sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connected successfully!");
  })
  .catch(err => {
    console.warn("⚠️ Database connection warning:", err.message);
  });