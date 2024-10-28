import express, { Request, Response } from "express";
import fileUpload from "express-fileupload";
import { Pool } from "pg";
import dotenv from "dotenv";
import xlsx from "xlsx";

dotenv.config();

const app = express();
app.use(fileUpload());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS telecom_data (
    id SERIAL PRIMARY KEY,
    call_date TIMESTAMP,
    caller VARCHAR(20),
    receiver VARCHAR(20),
    duration INT,
    result VARCHAR(50),
    cost DECIMAL(10, 2),
    service VARCHAR(255)
  );
`;

// Initialize table on startup
(async () => {
  const client = await pool.connect();
  try {
    await client.query(createTableQuery);
    console.log("Table telecom_data is ready");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    client.release();
  }
})();

app.get("/", (req: Request, res: Response) => {
  res.send("Добро пожаловать на сервер");
});

app.post("/upload", async (req: Request, res: Response): Promise<void> => {
  if (!req.files || !req.files.xmlFile) {
    res.status(400).send("XLSX файл не загружен");
    return;
  }

  const xmlFile = req.files.xmlFile as fileUpload.UploadedFile;
  const workbook = xlsx.read(xmlFile.data, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  const dataRows = jsonData.slice(7);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const row of dataRows as any[]) {
      const [call_date, caller, receiver, duration, result, cost, service] =
        row as [string, string, string, string, string, string, string];
      await client.query(
        "INSERT INTO telecom_data (call_date, caller, receiver, duration, result, cost, service) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [call_date, caller, receiver, duration, result, cost, service]
      );
    }
    await client.query("COMMIT");
    res.status(200).send("Файл успешно обработан и сохранён в БД");
  } catch (dbError) {
    await client.query("ROLLBACK");
    console.error("Ошибка при вставке данных в БД", dbError);
    const errorMessage =
      dbError instanceof Error ? dbError.message : "Unknown error";
    res.status(500).send(`Ошибка при вставке данных в БД: ${errorMessage}`);
  } finally {
    client.release();
  }
});

// New endpoint to retrieve data from telecom_data
app.get("/data", async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM telecom_data");
    res.status(200).json(result.rows);
  } catch (dbError) {
    console.error("Ошибка при получении данных из БД", dbError);
    res.status(500).send("Ошибка при получении данных из БД");
  } finally {
    client.release();
  }
});

app.get("/clear", async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM telecom_data");
    res.status(200).send("Данные успешно удалены");
  } catch (dbError) {
    console.error("Ошибка при удалении данных из БД", dbError);
    res.status(500).send("Ошибка при удалении данных из БД");
  } finally {
    client.release();
  }
});

app.get("/analyze/spending", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT caller,
             SUM(CASE WHEN cost = 0 THEN 0 ELSE cost END) AS overreach_cost,
             SUM(CASE WHEN cost = 0 THEN 1 ELSE 0 END) AS budget_covered_calls,
             COUNT(*) AS total_calls
      FROM telecom_data
      GROUP BY caller
      ORDER BY overreach_cost DESC
    `;
    const result = await client.query(query);
    res.status(200).json(result.rows);
  } catch (dbError) {
    console.error("Error in spending analysis:", dbError);
    res.status(500).send("Error in spending analysis");
  } finally {
    client.release();
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
