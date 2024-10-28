import React from "react";
import UploadFile from "./UploadFile";
import SpendingTable from "./SpendingTable";
import UploadedFiles from "./UploadedFiles";

const App: React.FC = () => (
  <div>
    <UploadFile />
    <UploadedFiles />
    <SpendingTable />
  </div>
);

export default App;
