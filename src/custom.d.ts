declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const value: string;
  export default value;
}
declare module "*.jpg" {
  const value: string;
  export default value;
}
declare module "*.jpeg" {
  const value: string;
  export default value;
}
declare module "*.gif" {
  const value: string;
  export default value;
}

interface ControllerConfig {
  keycloakUrl?: string;
  keycloakRealm?: string;
  keycloakClientId?: string;
  port?: number;
  dev?: boolean;
  url?: string;
}

interface Window {
  controllerConfig?: ControllerConfig;
}
