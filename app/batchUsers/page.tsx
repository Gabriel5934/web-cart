"use client";

import { Button } from "@mui/material";
import useUploadJson from "../firebase/useUploadJson";

export default function Page() {
  const { upload } = useUploadJson();

  return (
    <div>
      <h1>Batch Users</h1>
      <p>This page is for batch user operations.</p>
      <Button onClick={upload} type="button">
        Upload Users
      </Button>
    </div>
  );
}
