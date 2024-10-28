import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  TableSortLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import BarChartIcon from "@mui/icons-material/BarChart";

interface UploadedFile {
  id: number;
  file_name: string;
  upload_date: string;
}

interface SpendingData {
  caller: string;
  overreach_cost: number;
  budget_covered_calls: number;
  total_calls: number;
}

type Order = "asc" | "desc";

const UploadedFiles: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [analysisData, setAnalysisData] = useState<SpendingData[]>([]);
  const [currentFileId, setCurrentFileId] = useState<number | null>(null);
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<keyof SpendingData>("overreach_cost");
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/uploads`);
      setFiles(response.data);
    } catch (error) {
      console.error("Ошибка при получении списка файлов", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: number) => {
    if (
      !window.confirm(
        "Вы уверены, что хотите удалить этот файл и все связанные данные?"
      )
    )
      return;
    try {
      await axios.delete(`${apiUrl}/uploads/${fileId}`);
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    } catch (error) {
      console.error("Ошибка при удалении файла", error);
    }
  };

  const openAnalysis = async (fileId: number) => {
    setLoading(true);
    setCurrentFileId(fileId);
    try {
      const response = await axios.get(`${apiUrl}/analyze/spending/${fileId}`);
      const parsedData = response.data.map((item: any) => ({
        ...item,
        overreach_cost: parseFloat(item.overreach_cost) || 0, // Ensure numeric
        budget_covered_calls: parseInt(item.budget_covered_calls, 10) || 0, // Ensure integer
        total_calls: parseInt(item.total_calls, 10) || 0, // Ensure integer
      }));
      setAnalysisData(parsedData);
      setOpenModal(true);
    } catch (error) {
      console.error("Ошибка при анализе затрат", error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setOpenModal(false);
    setAnalysisData([]);
    setCurrentFileId(null);
  };

  // Handle sorting by column
  const handleSort = (property: keyof SpendingData) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedData = [...analysisData].sort((a, b) => {
    if (orderBy) {
      if (order === "asc") {
        return a[orderBy] < b[orderBy] ? -1 : 1;
      }
      return a[orderBy] > b[orderBy] ? -1 : 1;
    }
    return 0;
  });

  // Calculate total row values
  const totalOverreachCost = analysisData.reduce(
    (sum, item) => sum + item.overreach_cost,
    0
  );
  const totalBudgetCoveredCalls = analysisData.reduce(
    (sum, item) => sum + item.budget_covered_calls,
    0
  );
  const totalCalls = analysisData.reduce(
    (sum, item) => sum + item.total_calls,
    0
  );

  return (
    <Box p={3}>
      <Typography variant="h5">Загруженные файлы</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {files.map((file) => (
            <ListItem
              key={file.id}
              secondaryAction={
                <>
                  <IconButton
                    edge="end"
                    color="primary"
                    onClick={() => openAnalysis(file.id)}
                  >
                    <BarChartIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    color="secondary"
                    onClick={() => deleteFile(file.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText
                primary={file.file_name}
                secondary={`Дата загрузки: ${new Date(
                  file.upload_date
                ).toLocaleDateString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Modal for Spending Analysis */}
      <Modal open={openModal} onClose={closeModal}>
        <Box
          component={Paper}
          sx={{
            width: "80%",
            maxHeight: "80vh",
            overflowY: "auto",
            margin: "auto",
            mt: 4,
            p: 3,
          }}
        >
          <Typography variant="h6" align="center" gutterBottom>
            Анализ затрат для файла {currentFileId}
          </Typography>
          {analysisData.length === 0 ? (
            <Typography align="center">Нет данных для анализа</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "caller"}
                      direction={orderBy === "caller" ? order : "asc"}
                      onClick={() => handleSort("caller")}
                    >
                      Номер
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === "overreach_cost"}
                      direction={orderBy === "overreach_cost" ? order : "asc"}
                      onClick={() => handleSort("overreach_cost")}
                    >
                      Превышение бюджета (стоимость)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === "budget_covered_calls"}
                      direction={
                        orderBy === "budget_covered_calls" ? order : "asc"
                      }
                      onClick={() => handleSort("budget_covered_calls")}
                    >
                      Звонки, покрытые бюджетом
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === "total_calls"}
                      direction={orderBy === "total_calls" ? order : "asc"}
                      onClick={() => handleSort("total_calls")}
                    >
                      Общее количество звонков
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedData.map((data) => (
                  <TableRow key={data.caller}>
                    <TableCell>{data.caller}</TableCell>
                    <TableCell align="right">
                      {data.overreach_cost.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      {data.budget_covered_calls}
                    </TableCell>
                    <TableCell align="right">{data.total_calls}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>
                    <strong>Итого</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{totalOverreachCost.toFixed(2)}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{totalBudgetCoveredCalls}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{totalCalls}</strong>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default UploadedFiles;
