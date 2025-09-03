import { prisma } from "../db.config.js";

export const addDriving = async (data) => {
  const created = await prisma.driving.create({ data: data });
  return created.id;
};

export const getDriving = async (drivingId) => {
  const driving = await prisma.driving.findFirstOrThrow({
    where: { id: drivingId },
  });
  return driving;
};

export const getDrivingByUserId = async (userId, createdAt) => {
  const whereClause = {
    userId: userId,
  };
  if (createdAt) {
    const date = new Date(createdAt);
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));

    whereClause.createdAt = {
      gte: start,
      lte: end,
    };
  }

  const driving = await prisma.driving.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });
  return driving;
};

export const getDrivingByDeviceId = async (deviceId) => {
  const driving = await prisma.driving.findMany({
    where: { deviceId: deviceId },
    orderBy: { createdAt: "desc" },
  });
  return driving;
};

export const updateDriving = async (data) => {
  const updated = await prisma.driving.update({
    where: { id: data.id },
    data: data,
  });
  return updated;
};

export const addDevice = async (data) => {
  const created = await prisma.device.create({ data: data });
  return created.id;
};

export const getDevice = async (deviceId) => {
  const device = await prisma.device.findFirstOrThrow({
    where: { id: deviceId },
  });
  return device;
};

export const updateDevice = async (data) => {
  console.log(data);
  const updated = await prisma.device.update({
    where: { id: data.id },
    data: data,
  });
  return updated;
};

export const addEyes = async (data) => {
  const created = await prisma.eyes.create({ data: data });
  return created.id;
};

export const getEyes = async (eyesId) => {
  const eyes = await prisma.eyes.findFirstOrThrow({
    where: { id: eyesId },
  });
  return eyes;
};

export const getEyesByDrivingId = async (drivingId) => {
  const eyes = await prisma.eyes.findFirst({
    where: { drivingId: drivingId },
  });
  return eyes;
};

export const deleteDriving = async (drivingId) => {
  await prisma.driving.delete({ where: { id: drivingId } });
};

export const deleteEyes = async (eyesId) => {
  await prisma.eyes.delete({ where: { id: eyesId } });
};
