import React from "react";
import UploadFile from "./UploadFile";
import UploadedFiles from "./UploadedFiles";

const App: React.FC = () => (
  <div>
    <UploadFile />
    <UploadedFiles />
  </div>
);

export default App;
