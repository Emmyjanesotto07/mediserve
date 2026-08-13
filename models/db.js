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

// Check if we need to load mysql2
const databaseUrl = process.env.DATABASE_URL || 
  (process.env.MYSQL_HOST ? `mysql://${process.env.MYSQL_USER || 'root'}:${process.env.MYSQL_PASSWORD || ''}@${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT || 3306}/${process.env.MYSQL_DATABASE || 'Mediserve'}` : null);

try {
  const mysql2 = require("mysql2");
  
  if (databaseUrl) {
    sequelize = new Sequelize(databaseUrl, {
      dialect: "mysql",
      protocol: "mysql",
      logging: false,
      dialectModule: mysql2,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  } else {
    sequelize = new Sequelize(
      process.env.MYSQL_DATABASE || process.env.DB_NAME || "Mediserve",
      process.env.MYSQL_USER || process.env.DB_USER || "root",
      process.env.MYSQL_PASSWORD || process.env.DB_PASS || "",
      {
        host: process.env.MYSQL_HOST || process.env.DB_HOST || "localhost",
        port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
        dialect: "mysql",
        logging: false,
        dialectModule: mysql2,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  }
} catch (err) {
  console.error("⚠️ mysql2 not available, creating mock Sequelize instance");
  // Create a mock sequelize that won't crash the app
  sequelize = new Sequelize("mysql://localhost/temp", {
    logging: false,
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

export { sequelize };

// Handle connection errors gracefully without crashing
sequelize.authenticate().catch(err => {
  console.warn("⚠️ Database connection warning:", err.message);
});
