export type CmnError = {
  code: string;
  description: string;
  status?: string;
};
export interface IDeviceInfo {
  curOS?: string;
  curBrowser?: string;
  curIP?: string;
}
