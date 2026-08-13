import type { Prisma } from "@prisma/client";

const TURN_OPERATIONS_LOCK_ID = 7_310_001;
const ADMIN_OPERATIONS_LOCK_ID = 7_310_002;

async function acquireTransactionLock(tx: Prisma.TransactionClient, lockId: number) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockId})`;
}

export function lockTurnOperations(tx: Prisma.TransactionClient) {
  return acquireTransactionLock(tx, TURN_OPERATIONS_LOCK_ID);
}

export function lockAdminOperations(tx: Prisma.TransactionClient) {
  return acquireTransactionLock(tx, ADMIN_OPERATIONS_LOCK_ID);
}
