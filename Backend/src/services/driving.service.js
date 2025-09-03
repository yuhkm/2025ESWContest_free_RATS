import {
  responseFromDrivingStart,
  responseFromDrivingStatus,
  responseFromDrivingStop,
  responseFromDriving,
  responseFromDrivings,
} from "../dtos/driving.dto.js";
import { InvalidRequestError } from "../errors.js";
import {
  addDriving,
  getDriving,
  updateDriving,
  addDevice,
  getDevice,
  updateDevice,
  addEyes,
  getEyes,
  getDrivingByUserId,
  getDrivingByDeviceId,
  getEyesByDrivingId,
  deleteDriving,
  deleteEyes,
} from "../repositories/driving.repository.js";

export const drivingStart = async (payload, userId) => {
  // 1. Id 값이 유효한지 확인
  const { deviceId } = payload;
  if (!deviceId) {
    throw new Error("Device ID is required to start driving.");
  }

  // 2. deviceId로 디바이스 정보를 가져옴
  const device = await getDevice(deviceId);

  // 디바이스가 존재하는지 확인
  if (!device) {
    throw new Error("Device not found.");
  }
  // 디바이스가 사용 중인지 확인
  console.log("디바이스 상태", device.status);
  if (device.status === 1) {
    throw new Error("Device is already in use.");
  }

  // 3. 디바이스 상태를 1로 업데이트
  const updateData = {
    id: device.id,
    status: 1,
  };

  const updatedDevice = await updateDevice(updateData);

  // 4. driving 생성 (주행 시작 알림)
  const data = {
    deviceId: device.id,
    userId: userId,
  };
  const drivingId = await addDriving(data);
  const driving = await getDriving(drivingId);

  return responseFromDrivingStart({
    driving,
    device: updatedDevice,
  });
};

export const drivingStatus = async (payload) => {
  // 1. payload 값이 정상적으로 다 들어오는 지 확인한다.
  const { deviceId, mileage } = payload;
  if (!(deviceId && mileage >= 0)) {
    throw new Error("All fields are required: deviceId, mileage.");
  }
  // 2. deviceId로 디바이스 정보를 가져옴
  const device = await getDevice(deviceId);
  if (!device) {
    throw new Error("Device not found.");
  }

  // 3. deviceId로 driving을 가져옴
  const drivings = await getDrivingByDeviceId(deviceId);
  if (!drivings) {
    throw new Error("Drivings not found.");
  }

  // 4. 정상적이면 프론트에서 주행 상태를 업데이트 함.
  return responseFromDrivingStatus({
    payload,
    device,
    driving: drivings[0],
  });
};

export const drivingEnd = async (payload) => {
  // 1. Id 값이 유효한지 확인
  const { deviceId } = payload;
  if (!deviceId) {
    throw new Error("Device ID is required to start driving.");
  }

  // 2. deviceId로 디바이스 정보를 가져옴
  let device = await getDevice(deviceId);

  // 디바이스가 존재하는지 확인
  if (!device) {
    throw new Error("Device not found.");
  }
  device = await updateDevice({
    id: device.id,
    status: 2, // 종료 요청 상태로 업데이트
  });
  // !!디바이스가 사용 중일 때 대기 stop api에서 수정 요청할 예정
  while (device.status === 2) {
    device = await getDevice(deviceId);
  }

  // 3. deviceId로 driving을 가져옴
  const drivings = await getDrivingByDeviceId(deviceId);
  if (!drivings) {
    throw new Error("Drivings not found.");
  }

  // 4. 시선 값 처리
  const eyes = await getEyesByDrivingId(drivings[0].id);
  return responseFromDrivingStop({
    device,
    driving: drivings[0],
    eyes,
  });
};

export const drivingStop = async (payload) => {
  // 1. payload 값이 정상적으로 다 들어오는 지 확인한다.
  const { deviceId, mileage, bias, headway, left, right, front } = payload;
  const requiredFields = [deviceId, mileage, left, right, front, bias, headway];
  if (!requiredFields.every((field) => field !== undefined && field !== null)) {
    throw new Error(
      "All fields are required: deviceId, mileage, left, right, front, bias, headway."
    );
  }

  // 2. deviceId로 디바이스 정보를 가져옴
  const device = await getDevice(deviceId);
  if (!device) {
    throw new Error("Device not found.");
  }
  if (device.status === 0) {
    throw new Error("Device is not currently in use.");
  }

  // 3. deviceId로 driving을 가져옴
  const drivings = await getDrivingByDeviceId(deviceId);
  if (!drivings) {
    throw new Error("Driving not found.");
  }
  // 4. 주행 종료로 데이터를 DB에 업데이트
  const updateDrivingData = {
    id: drivings[0].id,
    mileage,
    bias: bias,
    headway: headway,
    endTime: new Date(),
  };
  const updatedDriving = await updateDriving(updateDrivingData);

  // 5. 눈 상태를 DB에 추가
  const data = {
    drivingId: updatedDriving.id,
    left,
    right,
    front,
  };
  const eyesId = await addEyes(data);
  const eyes = await getEyes(eyesId);
  // 6. device 상태를 종료 상태로 업데이트
  const updateDeviceData = {
    id: device.id,
    status: 0,
  };
  const updatedDevice = await updateDevice(updateDeviceData);
  return responseFromDrivingStop({
    device: updatedDevice,
    driving: updatedDriving,
    eyes,
  });
};

export const drivingOne = async (userId) => {
  const drivings = await getDrivingByUserId(userId, null);
  if (!drivings) {
    throw new InvalidRequestError("No driving records found for this user.");
  }
  const driving = drivings[0];

  const eyes = await getEyesByDrivingId(driving.id);
  return responseFromDriving({ driving, eyes });
};

export const drivingStatistics = async (userId, createdAt) => {
  const drivings = await getDrivingByUserId(userId, createdAt);
  if (!drivings) {
    throw new InvalidRequestError("No driving records found for this user.");
  }

  const drivingWithEyes = [];
  for (const driving of drivings) {
    let eyesData = await getEyesByDrivingId(driving.id);
    drivingWithEyes.push({
      ...driving,
      left: eyesData?.left ?? 0,
      right: eyesData?.right ?? 0,
      front: eyesData?.front ?? 0,
    });
  }
  return responseFromDrivings({ drivingWithEyes });
};

export const drivingTotalCount = async (userId) => {
  const drivings = await getDrivingByUserId(userId, null);
  if (!drivings) {
    throw new InvalidRequestError("No driving records found for this user.");
  }
  const count = drivings.length;
  const totalDistance = drivings.reduce((acc, driving) => {
    return acc + (driving.mileage || 0);
  }, 0);
  return {
    count,
    totalDistance,
  };
};

export const drivingInfo = async (drivingId) => {
  const driving = await getDriving(drivingId);
  if (!driving) {
    throw new InvalidRequestError("Driving record not found.");
  }
  const eyes = await getEyesByDrivingId(driving.id);
  return responseFromDriving({ driving, eyes });
};

export const drivingDeletion = async (drivingId) => {
  const driving = await getDriving(drivingId);
  if (!driving) {
    throw new InvalidRequestError("Driving record not found.");
  }
  const eyes = await getEyesByDrivingId(drivingId);
  if (eyes) {
    await deleteEyes(eyes.id);
  }
  await deleteDriving(drivingId);
  return { message: "Driving record deleted successfully." };
};
