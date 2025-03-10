import React from "react";
import { Alert, Snackbar, Stack } from "@mui/material";
import { useNotification } from "../context/NotificationContext";

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <Stack
      spacing={2}
      sx={{
        width: "100%",
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
      }}
    >
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          onClose={() => removeNotification(notification.id)}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
};

export default NotificationContainer;
