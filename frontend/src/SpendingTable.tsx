import React, { useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TableFooter,
  Paper,
  Button,
  Typography,
} from "@mui/material";

interface SpendingData {
  caller: string;
  overreach_cost: number;
  budget_covered_calls: number;
  total_calls: number;
}

type Order = "asc" | "desc";

const SpendingTable: React.FC = () => {
  const [spendingData, setSpendingData] = useState<SpendingData[]>([]);
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<keyof SpendingData>("overreach_cost");
  const [dataLoaded, setDataLoaded] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";

  // Sorting function
  const handleRequestSort = (property: keyof SpendingData) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedData = [...spendingData].sort((a, b) => {
    if (orderBy) {
      if (order === "asc") {
        return a[orderBy] < b[orderBy] ? -1 : 1;
      }
      return a[orderBy] > b[orderBy] ? -1 : 1;
    }
    return 0;
  });

  // Fetch data on button click
  const showData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/analyze/spending`);
      const data = response.data.map((item: any) => ({
        caller: item.caller,
        overreach_cost: parseFloat(item.overreach_cost) || 0,
        budget_covered_calls: parseInt(item.budget_covered_calls, 10) || 0,
        total_calls: parseInt(item.total_calls, 10) || 0,
      }));
      setSpendingData(data);
      setDataLoaded(true);
    } catch (error) {
      console.error("Ошибка загрузки данных", error);
    }
  };

  // Calculate totals
  const totalOverreachCost = spendingData.reduce(
    (sum, item) => sum + (item.overreach_cost || 0),
    0
  );
  const totalBudgetCoveredCalls = spendingData.reduce(
    (sum, item) => sum + (item.budget_covered_calls || 0),
    0
  );
  const totalCalls = spendingData.reduce(
    (sum, item) => sum + (item.total_calls || 0),
    0
  );

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" align="center" gutterBottom>
        Анализ затрат
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={showData}
        style={{ marginBottom: "20px" }}
      >
        Показать данные
      </Button>
      {dataLoaded && (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "caller"}
                    direction={orderBy === "caller" ? order : "asc"}
                    onClick={() => handleRequestSort("caller")}
                  >
                    Номер
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === "overreach_cost"}
                    direction={orderBy === "overreach_cost" ? order : "asc"}
                    onClick={() => handleRequestSort("overreach_cost")}
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
                    onClick={() => handleRequestSort("budget_covered_calls")}
                  >
                    Звонки, покрытые бюджетом
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === "total_calls"}
                    direction={orderBy === "total_calls" ? order : "asc"}
                    onClick={() => handleRequestSort("total_calls")}
                  >
                    Общее количество звонков
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((data, index) => (
                <TableRow
                  key={data.caller}
                  sx={{
                    backgroundColor:
                      index % 2 === 0 ? "rgba(0, 0, 0, 0.04)" : "white",
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.1)" },
                  }}
                >
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
              <TableRow sx={{ backgroundColor: "rgba(0, 0, 0, 0.1)" }}>
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
        </TableContainer>
      )}
    </div>
  );
};

export default SpendingTable;
