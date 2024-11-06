import express, { Request, Response } from "express";
import fileUpload from "express-fileupload";
import { Pool } from "pg";
import dotenv from "dotenv";
import xlsx from "xlsx";

dotenv.config();

const app = express();
app.use(
  fileUpload({
    defCharset: "utf8",
    defParamCharset: "utf8",
  })
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize tables on startup
(async () => {
  const client = await pool.connect();
  try {
    // Create telecom_data table if it does not exist
    await client.query(`
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
    `);

    // Create uploads table if it does not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        upload_date TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure file_id column exists in telecom_data
    await client.query(`
      ALTER TABLE telecom_data
      ADD COLUMN IF NOT EXISTS file_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE;
    `);

    console.log("Tables are ready");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    client.release();
  }
})();

app.get("/", (req: Request, res: Response) => {
  res.send("Добро пожаловать на сервер");
});

// Upload endpoint to store file metadata and insert data
app.post("/upload", async (req: Request, res: Response): Promise<void> => {
  if (!req.files || !req.files.xmlFile) {
    res.status(400).send("XLSX файл не загружен");
    return;
  }

  const xmlFile = req.files.xmlFile as fileUpload.UploadedFile;
  const fileName = xmlFile.name;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert file metadata into uploads table
    const uploadResult = await client.query(
      "INSERT INTO uploads (file_name) VALUES ($1) RETURNING id",
      [fileName]
    );
    const fileId = uploadResult.rows[0].id;

    // Process file data and insert into telecom_data
    const workbook = xlsx.read(xmlFile.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const dataRows = jsonData.slice(7);

    for (const row of dataRows as any[]) {
      const [call_date, caller, receiver, duration, result, cost, service] =
        row;
      await client.query(
        "INSERT INTO telecom_data (call_date, caller, receiver, duration, result, cost, service, file_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [call_date, caller, receiver, duration, result, cost, service, fileId]
      );
    }

    await client.query("COMMIT");
    res.status(200).send("Файл успешно обработан и сохранён в БД");
  } catch (dbError) {
    await client.query("ROLLBACK");
    console.error("Ошибка при вставке данных в БД", dbError);
    res.status(500).send(`Ошибка при вставке данных в БД: ${dbError}`);
  } finally {
    client.release();
  }
});

// Endpoint to retrieve all uploaded files with metadata
app.get("/uploads", async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM uploads ORDER BY upload_date DESC"
    );
    res.status(200).json(result.rows);
  } catch (dbError) {
    console.error("Ошибка при получении файлов", dbError);
    res.status(500).send("Ошибка при получении файлов");
  } finally {
    client.release();
  }
});

// Endpoint to retrieve data from telecom_data (with pagination)
app.get("/data", async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 100;
  const offset = (page - 1) * limit;

  try {
    const result = await client.query(
      "SELECT * FROM telecom_data ORDER BY id LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    res.status(200).json(result.rows);
  } catch (dbError) {
    console.error("Ошибка при получении данных из БД", dbError);
    res.status(500).send("Ошибка при получении данных из БД");
  } finally {
    client.release();
  }
});

// Endpoint to delete an uploaded file and associated data
app.delete(
  "/uploads/:id",
  async (req: Request, res: Response): Promise<void> => {
    const fileId = parseInt(req.params.id, 10);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM uploads WHERE id = $1", [fileId]);
      await client.query("COMMIT");
      res.status(200).send("Файл и связанные данные успешно удалены");
    } catch (dbError) {
      await client.query("ROLLBACK");
      console.error("Ошибка при удалении данных", dbError);
      res.status(500).send("Ошибка при удалении данных");
    } finally {
      client.release();
    }
  }
);

// Endpoint for spending analysis
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

// Clear all data from telecom_data
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

// Endpoint for spending analysis by file ID
app.get("/analyze/spending/:fileId", async (req: Request, res: Response) => {
  const fileId = parseInt(req.params.fileId, 10);
  const client = await pool.connect();
  try {
    const query = `
      SELECT caller,
             SUM(CASE WHEN cost = 0 THEN 0 ELSE cost END) AS overreach_cost,
             SUM(CASE WHEN cost = 0 THEN 1 ELSE 0 END) AS budget_covered_calls,
             COUNT(*) AS total_calls,
             SUM(CASE WHEN cost = 0 THEN duration ELSE 0 END) AS budget_minutes
      FROM telecom_data
      WHERE file_id = $1
      GROUP BY caller
      ORDER BY overreach_cost DESC
    `;
    const result = await client.query(query, [fileId]);
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
