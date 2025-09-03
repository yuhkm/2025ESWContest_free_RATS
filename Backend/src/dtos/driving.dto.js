export const responseFromDrivingStart = ({ driving, device }) => {
  return {
    deviceId: device.id,
    status: device.status,
    mileage: 0,
    startTime: driving.startTime,
    endTime: driving.endTime ?? driving.startTime,
    left: 0,
    right: 0,
    front: 0,
    createdAt: driving.createdAt,
  };
};

export const responseFromDrivingStatus = ({ payload, device, driving }) => {
  return {
    deviceId: device.id,
    status: device.status,
    mileage: payload.mileage,
    startTime: driving.startTime,
    endTime: new Date(),
    left: payload.left,
    right: payload.right,
    front: payload.front,
  };
};

export const responseFromDrivingStop = ({ driving, device, eyes }) => {
  return {
    deviceId: device.id,
    status: device.status,
    mileage: driving.mileage,
    startTime: driving.startTime,
    endTime: driving.endTime ?? driving.startTime,
    left: eyes?.left ?? 0,
    right: eyes?.right ?? 0,
    front: eyes?.front ?? 0,
  };
};

export const responseFromDriving = ({ driving, eyes }) => {
  return {
    drivingId: driving.id,
    mileage: driving.mileage,
    headway: driving.headway,
    bias: driving.bias,
    left: eyes?.left ?? 0,
    right: eyes?.right ?? 0,
    front: eyes?.front ?? 0,
    startTime: driving.startTime,
    endTime: driving.endTime ?? driving.startTime,
    createdAt: driving.createdAt,
  };
};

export const responseFromDrivings = ({ drivingWithEyes }) => {
  return drivingWithEyes.map((driving) => ({
    drivingId: driving.id,
    mileage: driving.mileage,
    headway: driving.headway,
    bias: driving.bias,
    left: driving.left,
    right: driving.right,
    front: driving.front,
    startTime: driving.startTime,
    endTime: driving.endTime ?? driving.startTime,
    createdAt: driving.createdAt,
  }));
};
