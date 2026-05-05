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
    `credits` INTEGER NOT NULL DEFAULT 0,
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

-- CreateTable
CREATE TABLE `plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `amount` INTEGER NOT NULL,
    `credits` INTEGER NOT NULL DEFAULT 0,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` TIMESTAMP(6) NULL,

    UNIQUE INDEX `plans_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_purchase_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `plan_id` INTEGER NOT NULL,
    `purchase_date` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` TIMESTAMP(6) NULL,

    INDEX `user_purchase_plans_user_id_idx`(`user_id`),
    INDEX `user_purchase_plans_plan_id_idx`(`plan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_purchase_plan_id` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `transaction_id` VARCHAR(255) NOT NULL,
    `purchase_date` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `transactions_transaction_id_key`(`transaction_id`),
    INDEX `transactions_user_purchase_plan_id_idx`(`user_purchase_plan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cm_modules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER NULL,
    `name` VARCHAR(255) NOT NULL,
    `route_name` VARCHAR(255) NULL,
    `icon` VARCHAR(255) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NULL DEFAULT 0,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` TIMESTAMP(6) NULL,

    INDEX `cm_modules_parent_id_idx`(`parent_id`),
    INDEX `cm_modules_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_module_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_role_id` INTEGER NOT NULL,
    `cms_module_id` INTEGER NOT NULL,
    `is_add` BOOLEAN NOT NULL DEFAULT false,
    `is_view` BOOLEAN NOT NULL DEFAULT false,
    `is_update` BOOLEAN NOT NULL DEFAULT false,
    `is_delete` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` TIMESTAMP(6) NULL,

    INDEX `cms_module_permissions_user_role_id_idx`(`user_role_id`),
    INDEX `cms_module_permissions_cms_module_id_idx`(`cms_module_id`),
    UNIQUE INDEX `cms_module_permissions_user_role_id_cms_module_id_key`(`user_role_id`, `cms_module_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserApiToken` ADD CONSTRAINT `UserApiToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_address` ADD CONSTRAINT `user_address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_userGroupId_fkey` FOREIGN KEY (`userGroupId`) REFERENCES `user_role`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_purchase_plans` ADD CONSTRAINT `user_purchase_plans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_purchase_plans` ADD CONSTRAINT `user_purchase_plans_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_purchase_plan_id_fkey` FOREIGN KEY (`user_purchase_plan_id`) REFERENCES `user_purchase_plans`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `cm_modules` ADD CONSTRAINT `cm_modules_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `cm_modules`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `cms_module_permissions` ADD CONSTRAINT `cms_module_permissions_user_role_id_fkey` FOREIGN KEY (`user_role_id`) REFERENCES `user_role`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `cms_module_permissions` ADD CONSTRAINT `cms_module_permissions_cms_module_id_fkey` FOREIGN KEY (`cms_module_id`) REFERENCES `cm_modules`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
