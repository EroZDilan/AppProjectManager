import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Notification, NotificationState } from "../types";
import { v4 as uuidv4 } from "uuid";

interface NotificationContextProps {
  notifications: Notification[];
  addNotification: (
    type: Notification["type"],
    message: string,
    duration?: number
  ) => void;
  removeNotification: (id: string) => void;
}

const initialState: NotificationState = {
  notifications: [],
};

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<NotificationState>(initialState);

  const addNotification = useCallback(
    (type: Notification["type"], message: string, duration = 5000) => {
      const id = uuidv4();
      const notification: Notification = { id, type, message };

      setState((prevState) => ({
        notifications: [...prevState.notifications, notification],
      }));

      // Auto-remove notification after duration
      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setState((prevState) => ({
      notifications: prevState.notifications.filter(
        (notification) => notification.id !== id
      ),
    }));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications: state.notifications,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification debe ser usado dentro de un NotificationProvider"
    );
  }
  return context;
};

export default NotificationContext;
