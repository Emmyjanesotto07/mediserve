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
import { createRequire } from "module";

dotenv.config();

const require = createRequire(import.meta.url);

let sequelize;

// =====================================================
// DATABASE CONFIGURATION
// =====================================================
//
// Supports both:
//
// DB_HOST / DB_PORT / DB_USER / DB_PASS / DB_NAME
//
// and Render/MySQL variables:
//
// MYSQL_HOST / MYSQL_PORT / MYSQL_USER / MYSQL_PASSWORD
//
// and:
//
// MYSQLHOST / MYSQLPORT / MYSQLUSER / MYSQLPASSWORD
// =====================================================

const DB_HOST =
  process.env.DB_HOST ||
  process.env.MYSQL_HOST ||
  process.env.MYSQLHOST ||
  "localhost";

const DB_PORT =
  process.env.DB_PORT ||
  process.env.MYSQL_PORT ||
  process.env.MYSQLPORT ||
  "3306";

const DB_USER =
  process.env.DB_USER ||
  process.env.MYSQL_USER ||
  process.env.MYSQLUSER ||
  "root";

const DB_PASS =
  process.env.DB_PASS ??
  process.env.MYSQL_PASSWORD ??
  process.env.MYSQLPASSWORD ??
  "";

const DB_NAME =
  process.env.DB_NAME ||
  process.env.MYSQL_DATABASE ||
  process.env.MYSQLDATABASE ||
  "Mediserve";

// =====================================================
// DATABASE CONNECTION
// =====================================================

try {
  const mysql2 = require("mysql2");

  console.log("");
  console.log("🔌 Database configuration:");
  console.log("   Host:", DB_HOST);
  console.log("   Port:", DB_PORT);
  console.log("   Database:", DB_NAME);
  console.log("   User:", DB_USER);
  console.log("");

  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: "mysql",
    dialectModule: mysql2,
    logging: false,

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

} catch (error) {
  console.error(
    "❌ Failed to initialize MySQL:",
    error.message
  );

  throw error;
}

// =====================================================
// EXPORT
// =====================================================

export { sequelize };

// =====================================================
// TEST DATABASE CONNECTION
// =====================================================

try {
  await sequelize.authenticate();

  console.log("✅ Database connected successfully!");

} catch (error) {

  console.error(
    "❌ Database connection failed:",
    error.message
  );

  // Make Render deployment fail clearly
  // instead of continuing with a broken database.
  process.exit(1);
}