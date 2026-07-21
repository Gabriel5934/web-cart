import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@mui/material";
import useUploadJson from "@/firebase/useUploadJson";

export const Route = createFileRoute("/batchUsers")({
  component: BatchUsersPage,
});

function BatchUsersPage() {
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
