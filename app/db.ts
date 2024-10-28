import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.warn("process.env.DATABASE_URL", process.env.DATABASE_URL);

const createTables = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS calls (
        id SERIAL PRIMARY KEY,
        caller VARCHAR(15),
        receiver VARCHAR(15),
        call_date TIMESTAMP,
        duration_minutes INTEGER,
        cost DECIMAL(10, 2),
        service_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS analysis (
        id SERIAL PRIMARY KEY,
        total_duration INTEGER,
        total_cost DECIMAL(10, 2),
        omc_cost DECIMAL(10, 2),
        own_income_cost DECIMAL(10, 2),
        analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Таблицы успешно созданы или уже существуют");
  } catch (err) {
    console.error("Ошибка при создании таблиц", err);
  } finally {
    client.release();
  }
};

// Вызываем функцию создания таблиц
createTables().catch((err) =>
  console.error("Ошибка при инициализации таблиц:", err)
);

export default pool;
