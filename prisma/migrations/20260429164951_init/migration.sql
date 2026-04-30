-- CreateTable
CREATE TABLE `user_role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `type` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `isSuperAdmin` BOOLEAN NOT NULL DEFAULT false,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(6) NULL,
    `updatedAt` TIMESTAMP(6) NULL,
    `deletedAt` TIMESTAMP(6) NULL,

    UNIQUE INDEX `user_role_title_key`(`title`),
    UNIQUE INDEX `user_role_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserApiToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `api_token` VARCHAR(191) NOT NULL,
    `device_type` VARCHAR(191) NULL,
    `device_token` VARCHAR(191) NULL,
    `platform_type` VARCHAR(191) NULL,
    `platform_id` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_address` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `addressLine1` VARCHAR(255) NOT NULL,
    `addressLine2` VARCHAR(255) NULL,
    `city` VARCHAR(150) NOT NULL,
    `state` VARCHAR(150) NULL,
    `country` VARCHAR(150) NOT NULL,
    `postalCode` VARCHAR(50) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` TIMESTAMP(6) NULL,

    INDEX `user_address_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userGroupId` INTEGER NULL,
    `createdBy` INTEGER NOT NULL DEFAULT 0,
    `userType` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `name` VARCHAR(255) NULL,
    `lname` VARCHAR(255) NULL,
    `username` VARCHAR(150) NOT NULL DEFAULT 'temp_username',
    `slug` VARCHAR(150) NOT NULL DEFAULT 'temp_slug',
    `email` VARCHAR(150) NULL,
    `mobileNumber` VARCHAR(150) NULL,
    `dob` VARCHAR(250) NULL,
    `age` INTEGER NOT NULL DEFAULT 0,
    `gender` ENUM('MALE', 'FEMALE') NOT NULL DEFAULT 'MALE',
    `profileType` ENUM('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    `password` VARCHAR(255) NOT NULL,
    `imageUrl` TEXT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `isEmailVerify` BOOLEAN NOT NULL DEFAULT false,
    `emailVerifyAt` DATETIME(3) NULL,
    `platformType` VARCHAR(191) NOT NULL DEFAULT 'custom',
    `platformId` VARCHAR(191) NULL,
    `emailOtp` VARCHAR(100) NULL,
    `emailOtpCreatedAt` DATETIME(3) NULL,
    `createdAt` TIMESTAMP(6) NULL,
    `updatedAt` TIMESTAMP(6) NULL,
    `deletedAt` TIMESTAMP(6) NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_slug_key`(`slug`),
    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_mobileNumber_key`(`mobileNumber`),
    INDEX `User_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NULL,
    `url` TEXT NOT NULL,
    `type` ENUM('IMAGE', 'VIDEO', 'DOCUMENT') NOT NULL DEFAULT 'IMAGE',
    `relatedType` VARCHAR(100) NULL,
    `relatedId` INTEGER NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` TIMESTAMP(6) NULL,

    INDEX `media_relatedType_relatedId_idx`(`relatedType`, `relatedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserApiToken` ADD CONSTRAINT `UserApiToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_address` ADD CONSTRAINT `user_address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_userGroupId_fkey` FOREIGN KEY (`userGroupId`) REFERENCES `user_role`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
