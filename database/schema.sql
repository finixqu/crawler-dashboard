CREATE DATABASE IF NOT EXISTS crawler_dashboard
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE crawler_dashboard;


-- PLATFORMS

CREATE TABLE crawler_platforms (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- CRAWLER GROPUS

CREATE TABLE crawler_groups (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- CRAWLER JOBS
CREATE TABLE crawler_jobs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    platform_id INT UNSIGNED NOT NULL,
    mode ENUM('project', 'group'),
    project_id BIGINT UNSIGNED NULL,
    group_id INT UNSIGNED NULL,
    since DATETIME NOT NULL,
    until DATETIME NOT NULL,
    status ENUM('pending', 'starting', 'running', 'success', 'failed', 'stopped') NOT NULL DEFAULT 'pending',
    tmux_session VARCHAR(500) NULL,
    log_path VARCHAR(500) NULL,
    command TEXT NULL,
    error_message TEXT NULL,
    started_at DATETIME NULL,
    finished_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_jobs_platform
        FOREIGN KEY (platform_id)
        REFERENCES crawler_platforms(id),
    
    CONSTRAINT fk_jobs_group
        FOREIGN KEY (group_id)
        REFERENCES crawler_groups(id),

    INDEX idx_jobs_status (status),
    INDEX idx_jobs_platform (platform_id),
    INDEX idx_jobs_project (project_id),
    INDEX idx_jobs_created_at (created_at)
);


-- CRAWLER SESSIONS

CREATE TABLE crawler_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT UNSIGNED NOT NULL,
    session_name VARCHAR(150) NOT NULL UNIQUE,
    status ENUM(
        'created',
        'running',
        'finished',
        'stopped',
        'failed'
    ) NOT NULL DEFAULT 'created',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME NULL,
    finished_at DATETIME NULL,

    CONSTRAINT fk_sessions_job
        FOREIGN KEY (job_id)
        REFERENCES crawler_jobs(id)
        ON DELETE CASCADE

);


-- CRAWLER LOGS

CREATE TABLE crawler_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT UNSIGNED NOT NULL,
    log_path VARCHAR(500) NOT NULL,
    last_position BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_logs_job
        FOREIGN KEY (job_id)
        REFERENCES crawler_jobs(id)
        ON DELETE CASCADE
);


