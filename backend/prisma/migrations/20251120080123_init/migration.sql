-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custodial_wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT NOT NULL,
    "derivationPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custodial_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "held_assets" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "assetAddress" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "decimals" INTEGER NOT NULL,
    "amount" TEXT NOT NULL,
    "usdValue" DECIMAL(18,2),
    "drainedFrom" TEXT NOT NULL,
    "drainJobId" TEXT,
    "drainDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'held',

    CONSTRAINT "held_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "assetAddress" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "hopsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalHops" INTEGER NOT NULL DEFAULT 10,
    "estimatedGasCost" DECIMAL(18,8),
    "actualGasCost" DECIMAL(18,8),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mixing_hops" (
    "id" TEXT NOT NULL,
    "withdrawalRequestId" TEXT NOT NULL,
    "hopNumber" INTEGER NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "gasUsed" DECIMAL(18,8),
    "delaySeconds" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "mixing_hops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drain_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sourceAddress" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalAssets" INTEGER NOT NULL DEFAULT 0,
    "successfulTransfers" INTEGER NOT NULL DEFAULT 0,
    "failedTransfers" INTEGER NOT NULL DEFAULT 0,
    "totalValueUsd" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "drain_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ephemeral_wallets" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT NOT NULL,
    "usedInHopId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "burned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ephemeral_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "custodial_wallets_userId_network_key" ON "custodial_wallets"("userId", "network");

-- CreateIndex
CREATE INDEX "held_assets_walletId_idx" ON "held_assets"("walletId");

-- CreateIndex
CREATE INDEX "held_assets_status_idx" ON "held_assets"("status");

-- CreateIndex
CREATE INDEX "withdrawal_requests_userId_idx" ON "withdrawal_requests"("userId");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");

-- CreateIndex
CREATE INDEX "mixing_hops_withdrawalRequestId_idx" ON "mixing_hops"("withdrawalRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "drain_history_jobId_key" ON "drain_history"("jobId");

-- CreateIndex
CREATE INDEX "drain_history_userId_idx" ON "drain_history"("userId");

-- CreateIndex
CREATE INDEX "drain_history_sourceAddress_idx" ON "drain_history"("sourceAddress");

-- CreateIndex
CREATE INDEX "drain_history_status_idx" ON "drain_history"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ephemeral_wallets_address_key" ON "ephemeral_wallets"("address");

-- CreateIndex
CREATE INDEX "ephemeral_wallets_burned_idx" ON "ephemeral_wallets"("burned");

-- AddForeignKey
ALTER TABLE "custodial_wallets" ADD CONSTRAINT "custodial_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "held_assets" ADD CONSTRAINT "held_assets_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "custodial_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mixing_hops" ADD CONSTRAINT "mixing_hops_withdrawalRequestId_fkey" FOREIGN KEY ("withdrawalRequestId") REFERENCES "withdrawal_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
