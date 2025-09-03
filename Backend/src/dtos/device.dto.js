export const responseFromDevice = ({ device }) => {
    return {
        deviceId: device.id,
        code: device.code,
        status: device.status,
  };
}
export const responseFromDevices = ({ devices }) => {
    return devices.map(device => ({
        deviceId: device.id,
        code: device.code,
        status: device.status,
    }));
}