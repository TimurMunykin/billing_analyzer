import React, { useState } from "react";
import axios from "axios";

const UploadFile: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Выберите файл перед загрузкой");
      return;
    }
    const formData = new FormData();
    formData.append("xmlFile", file);

    try {
      const response = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (error) {
      console.error("Ошибка загрузки файла", error);
      alert("Ошибка загрузки файла");
    }
  };

  return (
    <div>
      <h2>Загрузите XML-файл для анализа</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Загрузить</button>
      {result && (
        <div>
          <h3>Результат:</h3>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
};

export default UploadFile;
