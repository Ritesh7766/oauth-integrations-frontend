import { useState, useEffect } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import axios from "axios";

export const OAuthIntegration = ({
  user,
  org,
  integrationType,
  integrationParams,
  setIntegrationParams,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const integrationName = integrationType.toLowerCase();

  const handleConnectClick = async () => {
    try {
      setIsConnecting(true);

      const formData = new FormData();
      formData.append("user_id", user);
      formData.append("org_id", org);

      const { data: authURL } = await axios.post(
        `http://localhost:8000/integrations/${integrationName}/authorize`,
        formData
      );

      const popup = window.open(
        authURL,
        `${integrationType} Authorization`,
        "width=600,height=600"
      );

      const pollTimer = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          await handleWindowClosed();
        }
      }, 200);
    } catch (e) {
      alert(e?.response?.data?.detail);
      setIsConnecting(false);
    }
  };

  const handleWindowClosed = async () => {
    try {
      const formData = new FormData();
      formData.append("user_id", user);
      formData.append("org_id", org);

      const { data: credentials } = await axios.post(
        `http://localhost:8000/integrations/${integrationName}/credentials`,
        formData
      );

      if (credentials) {
        setIntegrationParams(prev => ({
          ...prev,
          credentials,
          type: integrationType,
        }));
        setIsConnected(true);
      }
    } catch (e) {
      alert(e?.response?.data?.detail);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    setIsConnected(Boolean(integrationParams?.credentials));
  }, [integrationParams]);

  return (
    <Box sx={{ mt: 2 }}>
      Parameters
      <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color={isConnected ? "success" : "primary"}
          disabled={isConnecting || isConnected}
          onClick={handleConnectClick}
        >
          {isConnected ? (
            `${integrationType} Connected`
          ) : isConnecting ? (
            <CircularProgress size={20} />
          ) : (
            `Connect to ${integrationType}`
          )}
        </Button>
      </Box>
    </Box>
  );
};
