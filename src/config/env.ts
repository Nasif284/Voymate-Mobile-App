/**
 * Environment configuration for Voymate Mobile
 *
 * For physical iPhone/Android devices on the same Wi-Fi network:
 * We connect to your computer's LAN IP on port 5000.
 */
const PROD_API_URL = 'https://api.travelbuddy.nasifhub.online/api/v1';
const PROD_SOCKET_URL = 'https://api.travelbuddy.nasifhub.online';

// Your computer's Wi-Fi IP on your local network
const LOCAL_LAN_IP = '192.168.20.2';
const DEV_LAN_API_URL = `http://${LOCAL_LAN_IP}:5000/api/v1`;
const DEV_LAN_SOCKET_URL = `http://${LOCAL_LAN_IP}:5000`;

// Active ngrok tunnel (bypasses Windows Firewall & Wi-Fi router isolation)
const DEV_TUNNEL_URL = 'https://early-fountain-ungloved.ngrok-free.dev';

type ConnectionMode = 'tunnel' | 'local' | 'prod';
const CONNECTION_MODE: ConnectionMode = 'tunnel' as ConnectionMode;

const getApiUrl = () => {
  switch (CONNECTION_MODE) {
    case 'prod':
      return PROD_API_URL;
    case 'tunnel':
      return `${DEV_TUNNEL_URL}/api/v1`;
    case 'local':
    default:
      return DEV_LAN_API_URL;
  }
};

const getSocketUrl = () => {
  switch (CONNECTION_MODE) {
    case 'prod':
      return PROD_SOCKET_URL;
    case 'tunnel':
      return DEV_TUNNEL_URL;
    case 'local':
    default:
      return DEV_LAN_SOCKET_URL;
  }
};

export const ENV = {
  API_URL: getApiUrl(),
  SOCKET_URL: getSocketUrl(),
  IS_DEV: __DEV__,
} as const;
