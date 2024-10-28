import express, { Request, Response } from "express";
import fileUpload from "express-fileupload";
import { parseXML } from "./xmlParser";

const app = express();
app.use(fileUpload());

app.post("/upload", async (req: Request, res: Response): Promise<void> => {
  if (!req.files || !req.files.xmlFile) {
    res.status(400).send("XML файл не загружен");
    return;
  }

  const xmlFile = req.files.xmlFile as fileUpload.UploadedFile;
  try {
    // Обработка файла, например, вызов функции parseXML
    await parseXML(xmlFile.data.toString());
    res.status(200).send("Файл успешно обработан и сохранён в БД");
  } catch (error) {
    console.error("Ошибка при обработке файла", error);
    res.status(500).send("Ошибка при обработке файла");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
