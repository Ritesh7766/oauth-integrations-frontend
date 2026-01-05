import { useState, useEffect } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import axios from "axios";


/**
 * OAuthIntegration
 *
 * Generic OAuth connector UI for third-party integrations (e.g. Notion, Airtable).
 *
 * Responsibilities:
 * - Initiates OAuth by requesting an authorization URL from the backend
 * - Opens the OAuth flow in a popup window
 * - Polls until the popup is closed
 * - Fetches credentials from the backend after OAuth completes
 * - Updates parent-managed integration state via setIntegrationParams
 *
 * This component does NOT:
 * - Store credentials long-term
 * - Decide what to do with the credentials
 * - Know anything about downstream data usage
 *
 * Props:
 * @param {string} user - User identifier passed to backend
 * @param {string} org - Organization identifier passed to backend
 * @param {string} integrationType - Integration name (e.g. "Notion", "Airtable")
 * @param {Object} integrationParams - Parent-owned integration state
 * @param {Function} setIntegrationParams - Setter to update parent integration state
 */
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
        formData,
      );

      const popup = window.open(
        authURL,
        `${integrationType} Authorization`,
        "width=600,height=600",
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
        formData,
      );

      if (credentials) {
        setIntegrationParams((prev) => ({
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
