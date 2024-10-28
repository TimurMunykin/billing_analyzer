import React, { useState } from "react";
import axios from "axios";
import { Button, CircularProgress, Typography, Box } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteIcon from "@mui/icons-material/Delete";

const UploadFile: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";
  const isDebug = process.env.NODE_ENV === "development";

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

    setLoading(true); // Start loading spinner
    try {
      const response = await axios.post(`${apiUrl}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (error) {
      console.error("Ошибка загрузки файла", error);
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  const getData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/data`);
      console.log("response", response);
    } catch (error) {
      console.error("Ошибка загрузки данных", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
      p={3}
    >
      <Typography variant="h5">Загрузите файл для анализа</Typography>

      <input
        type="file"
        onChange={handleFileChange}
        style={{ marginBottom: "10px" }}
      />

      <Button
        variant="contained"
        color="primary"
        startIcon={<UploadFileIcon />}
        onClick={handleFileUpload}
        disabled={loading || !file}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Загрузить"}
      </Button>

      {isDebug && (
        <Button
          variant="outlined"
          color="secondary"
          onClick={getData}
          disabled={loading}
          style={{ marginTop: "10px" }}
        >
          Загрузить данные
        </Button>
      )}

      {result && (
        <Box mt={3} p={2} border={1} borderRadius={1} borderColor="grey.400">
          <Typography variant="h6">Результат:</Typography>
          <Typography>{result}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default UploadFile;
