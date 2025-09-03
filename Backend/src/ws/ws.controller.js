import { deviceHello, deviceList } from "../services/device.service.js";
import {
  drivingEnd,
  drivingStart,
  drivingStatus,
  drivingStop,
} from "../services/driving.service.js";
export const handlePrivateSocket = async (message, userId) => {
  const { type, payload } = message;

  switch (type) {
    case "DRIVING:START":
      return await drivingStart(payload, userId);
    case "DRIVING:END":
      return await drivingEnd(payload);
    case "DEVICE:LIST":
      return await deviceList();
    default:
      throw new Error("Unknown message type");
  }
};

export const handlePublicSocket = async (message) => {
  const { type, payload } = message;

  switch (type) {
    case "DEVICE:HELLO":
      return await deviceHello(payload);
    case "DRIVING:STATUS":
      return await drivingStatus(payload);
    case "DRIVING:STOP":
      return await drivingStop(payload);
    case "SOCKET:TEST":
      // 테스트 용 메시지 처리
      return { status: "success", message: "Test message received" };
    default:
      throw new Error("Unknown test message type");
  }
};
