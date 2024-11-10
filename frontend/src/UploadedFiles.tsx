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
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import BarChartIcon from "@mui/icons-material/BarChart";
import { styled } from "@mui/material/styles";

interface UploadedFile {
  id: number;
  file_name: string;
  upload_date: string;
}

interface SpendingData {
  service: string;
  caller: string;
  overreach_cost: number;
  budget_covered_calls: number;
  total_calls: number;
  budget_minutes: number;
  exceeded_minutes: number; // Add this line
}

type Order = "asc" | "desc";

const StyledTableContainer = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  boxShadow: theme.shadows[3],
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1.5),
  fontWeight: theme.typography.fontWeightRegular,
  "&:nth-of-type(1)": {
    fontWeight: theme.typography.fontWeightMedium,
  },
}));

const StyledModalContent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: "80%",
  maxHeight: "80vh",
  overflowY: "auto",
  margin: "auto",
  outline: "none",
  boxShadow: theme.shadows[5],
}));

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
        overreach_cost: parseFloat(item.overreach_cost),
        budget_covered_calls: parseInt(item.budget_covered_calls, 10) || 0,
        total_calls: parseInt(item.total_calls, 10) || 0,
        budget_minutes: parseInt(item.budget_minutes, 10) || 0,
        exceeded_minutes: parseInt(item.exceeded_minutes, 10) || 0, // Add this line
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

  const groupedData = sortedData.reduce((acc: any, item) => {
    if (!acc[item.service]) {
      acc[item.service] = [];
    }
    acc[item.service].push(item);
    return acc;
  }, {});

  const totalOverreachCost = analysisData.reduce(
    (sum, item) => sum + Number(item.overreach_cost),
    0
  );
  const totalBudgetCoveredCalls = analysisData.reduce(
    (sum, item) => sum + Number(item.budget_covered_calls),
    0
  );
  const totalCalls = analysisData.reduce(
    (sum, item) => sum + Number(item.total_calls),
    0
  );

  const totalBudgetMinutes = analysisData.reduce(
    (sum, item) => sum + Number(item.budget_minutes),
    0
  );

  const totalExceededMinutes = analysisData.reduce(
    (sum, item) => sum + Number(item.exceeded_minutes),
    0
  );

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Загруженные файлы
      </Typography>
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
        <StyledModalContent>
          <Typography variant="h6" align="center" gutterBottom>
            Анализ зартат для файла {currentFileId}
          </Typography>
          <Divider />
          {analysisData.length === 0 ? (
            <Typography align="center" sx={{ mt: 2 }}>
              Нет данных для анализа
            </Typography>
          ) : (
            <>
              {Object.keys(groupedData).map((service) => (
                <React.Fragment key={service}>
                  <Typography variant="h6" gutterBottom>
                    {service}
                  </Typography>
                  <StyledTableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <StyledTableCell>
                            <TableSortLabel
                              active={orderBy === "caller"}
                              direction={orderBy === "caller" ? order : "asc"}
                              onClick={() => handleSort("caller")}
                            >
                              Номер
                            </TableSortLabel>
                          </StyledTableCell>
                          <StyledTableCell align="right">
                            <TableSortLabel
                              active={orderBy === "overreach_cost"}
                              direction={
                                orderBy === "overreach_cost" ? order : "asc"
                              }
                              onClick={() => handleSort("overreach_cost")}
                            >
                              Превышение бюджета (стоимость)
                            </TableSortLabel>
                          </StyledTableCell>
                          <StyledTableCell align="right">
                            <TableSortLabel
                              active={orderBy === "budget_covered_calls"}
                              direction={
                                orderBy === "budget_covered_calls"
                                  ? order
                                  : "asc"
                              }
                              onClick={() => handleSort("budget_covered_calls")}
                            >
                              Звонки, покрытые бюджетом
                            </TableSortLabel>
                          </StyledTableCell>
                          <StyledTableCell align="right">
                            <TableSortLabel
                              active={orderBy === "total_calls"}
                              direction={
                                orderBy === "total_calls" ? order : "asc"
                              }
                              onClick={() => handleSort("total_calls")}
                            >
                              Общее количество звонков
                            </TableSortLabel>
                          </StyledTableCell>
                          <StyledTableCell align="right">
                            <TableSortLabel
                              active={orderBy === "budget_minutes"}
                              direction={
                                orderBy === "budget_minutes" ? order : "asc"
                              }
                              onClick={() => handleSort("budget_minutes")}
                            >
                              Минуты в бюджете
                            </TableSortLabel>
                          </StyledTableCell>
                          <StyledTableCell align="right">
                            <TableSortLabel
                              active={orderBy === "exceeded_minutes"}
                              direction={
                                orderBy === "exceeded_minutes" ? order : "asc"
                              }
                              onClick={() => handleSort("exceeded_minutes")}
                            >
                              Превышение бюджета (минуты)
                            </TableSortLabel>
                          </StyledTableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupedData[service].map((data: SpendingData) => (
                          <TableRow
                            key={data.caller}
                            sx={{
                              "&:nth-of-type(even)": {
                                backgroundColor: "#f9f9f9",
                              },
                            }}
                          >
                            <StyledTableCell>{data.caller}</StyledTableCell>
                            <StyledTableCell align="right">
                              {data.overreach_cost.toFixed(2)}
                            </StyledTableCell>
                            <StyledTableCell align="right">
                              {data.budget_covered_calls}
                            </StyledTableCell>
                            <StyledTableCell align="right">
                              {data.total_calls}
                            </StyledTableCell>
                            <StyledTableCell align="right">
                              {data.budget_minutes}
                            </StyledTableCell>
                            <StyledTableCell align="right">
                              {data.exceeded_minutes}
                            </StyledTableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </StyledTableContainer>
                </React.Fragment>
              ))}
            </>
          )}
        </StyledModalContent>
      </Modal>
    </Box>
  );
};

export default UploadedFiles;
