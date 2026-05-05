-- CreateTable
CREATE TABLE `financial_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `user_id` INTEGER NULL,
    `retirement_start_year` INTEGER NOT NULL DEFAULT 2040,
    `beginning_balance` DECIMAL(14, 2) NOT NULL,
    `lasting_funds_annual` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `recurring_living_expenses_annual` DECIMAL(14, 2) NOT NULL,
    `retirement_age` INTEGER NOT NULL,
    `return_on_investment` DECIMAL(8, 4) NOT NULL,
    `cost_of_living_inflation_rate` DECIMAL(8, 4) NOT NULL,
    `income_appreciation_rate` DECIMAL(8, 4) NOT NULL,
    `withdrawal_tax_rate` DECIMAL(8, 4) NOT NULL,
    `run_out_age` INTEGER NULL,
    `real_estate_value` DECIMAL(14, 2) NOT NULL,
    `real_estate_appreciation_rate` DECIMAL(8, 4) NOT NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL,
    `deleted_at` TIMESTAMP(6) NULL,

    UNIQUE INDEX `financial_plans_slug_key`(`slug`),
    INDEX `financial_plans_user_id_idx`(`user_id`),
    INDEX `financial_plans_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `term_fund_sources` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `financial_plan_id` INTEGER NOT NULL,
    `amount_per_year` DECIMAL(14, 2) NOT NULL,
    `beginning_year` INTEGER NOT NULL,
    `ending_year` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `term_fund_sources_financial_plan_id_idx`(`financial_plan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `one_time_expenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `financial_plan_id` INTEGER NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `purchase_year` INTEGER NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `one_time_expenses_financial_plan_id_idx`(`financial_plan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `financial_plans` ADD CONSTRAINT `financial_plans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `term_fund_sources` ADD CONSTRAINT `term_fund_sources_financial_plan_id_fkey` FOREIGN KEY (`financial_plan_id`) REFERENCES `financial_plans`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `one_time_expenses` ADD CONSTRAINT `one_time_expenses_financial_plan_id_fkey` FOREIGN KEY (`financial_plan_id`) REFERENCES `financial_plans`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
