DROP DATABASE IF EXISTS pa25;
CREATE DATABASE pa25 DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_general_ci;
USE pa25;


CREATE TABLE users (
  user_id CHAR(36),
  firstname VARCHAR(50) NOT NULL,
  lastname VARCHAR(50) NOT NULL,
  dob DATE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password CHAR(128) NOT NULL,
  role VARCHAR(50),
  country VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  street VARCHAR(255) NOT NULL,
  pc VARCHAR(10) NOT NULL,
  inscription_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN NOT NULL,
  stripe_id VARCHAR(255),
  PRIMARY KEY(user_id),
  UNIQUE(phone),
  UNIQUE(email),
  UNIQUE(stripe_id)
);


CREATE TABLE verifications(
    user_id CHAR(36),
    code VARCHAR(6) NOT NULL,
    creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

CREATE TABLE sessions(
    session_id char(32),
    user_id char(36),
    creation_date DATETIME not null,
    exp_date DATETIME not null,
    revoked BOOLEAN not null default FALSE,
    PRIMARY KEY(session_id, user_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);


CREATE TABLE administrators(
   admin_id CHAR(36),
   PRIMARY KEY(admin_id),
   FOREIGN KEY(admin_id) REFERENCES users(user_id)
);

CREATE TABLE categories(
   category_id CHAR(36),
   title VARCHAR(255) NOT NULL,
   PRIMARY KEY(category_id),
   UNIQUE(title)

);

CREATE TABLE ngo(
   ngo_id CHAR(36),
   name VARCHAR(255) NOT NULL,
   registration_number VARCHAR(50) NOT NULL,
   registration_date DATETIME NOT NULL,
   address VARCHAR(255) NOT NULL,
   country VARCHAR(50) NOT NULL,
   type VARCHAR(255) NOT NULL,
   presentation TEXT NOT NULL,
   website VARCHAR(255) NOT NULL,
   phone VARCHAR(50) NOT NULL,
   stripe_id VARCHAR(50),
   PRIMARY KEY(ngo_id),
   UNIQUE(name),
   UNIQUE(registration_number),
   UNIQUE(stripe_id)
);

CREATE TABLE packs(
   pack_id CHAR(36),
   name VARCHAR(50) NOT NULL,
   creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   activity_number INT NOT NULL,
   annual_collaborator_price SMALLINT NOT NULL,
   bonus_consultation_price SMALLINT NOT NULL,
   default_consultation_number SMALLINT NOT NULL,
   staff_size SMALLINT NOT NULL,
   chatbot_messages_number SMALLINT,
   PRIMARY KEY(pack_id)

);

CREATE TABLE tickets (
     ticket_id CHAR(36),
     title VARCHAR(255) NOT NULL,
     text TEXT NOT NULL,
     open_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     close_date DATETIME,
     user_id CHAR(36) NOT NULL,
     admin_id CHAR(36),
     PRIMARY KEY(ticket_id),
     FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
     FOREIGN KEY(admin_id) REFERENCES administrators(admin_id)
);

CREATE TABLE messages (
  ticket_id CHAR(36),
  messages_id CHAR(36),
  text TEXT NOT NULL,
  creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id CHAR(36),
  admin_id CHAR(36),
  PRIMARY KEY(ticket_id, messages_id),
  FOREIGN KEY(ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY(admin_id) REFERENCES administrators(admin_id),
  FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE companies(
   company_id CHAR(36),
   name VARCHAR(255) NOT NULL,
   website VARCHAR(255),
   registration_number VARCHAR(50) NOT NULL,
   registration_date DATE NOT NULL,
   industry VARCHAR(50) NOT NULL,
   revenue INT NOT NULL,
   size INT NOT NULL,
   admin_id CHAR(36),
   PRIMARY KEY(company_id),
   UNIQUE(name),
   UNIQUE(website),
   UNIQUE(registration_number),
   FOREIGN KEY (company_id) REFERENCES users(user_id) ON DELETE CASCADE,
   FOREIGN KEY(admin_id) REFERENCES administrators(admin_id) ON DELETE SET NULL
);

CREATE TABLE contractors(
   contractor_id CHAR(36),
   registration_number VARCHAR(50) NOT NULL,
   registration_date DATE NOT NULL,
   contract_file varchar(255),
   sign_date VARCHAR(50),
   service VARCHAR(255) NOT NULL,
   service_price INT NOT NULL,
   website VARCHAR(255),
   intervention VARCHAR(50) NOT NULL,
   type VARCHAR(10) NOT NULL,
   admin_id CHAR(36),
   PRIMARY KEY(contractor_id),
   UNIQUE(registration_number),
   UNIQUE(contract_file),
   FOREIGN KEY(contractor_id) REFERENCES users(user_id) ON DELETE CASCADE,
   FOREIGN KEY(admin_id) REFERENCES administrators(admin_id) ON DELETE SET NULL
);

CREATE TABLE events(
   event_id CHAR(36),
   created_at DATETIME NOT NULL,
   begin_at DATETIME NOT NULL,
   end_at DATETIME NOT NULL,
   place VARCHAR(255) NOT NULL,
   title VARCHAR(255) NOT NULL,
   capacity INT NOT NULL,
   ngo_id CHAR(36),
   PRIMARY KEY(event_id),
  FOREIGN KEY (ngo_id) REFERENCES ngo(ngo_id) ON DELETE CASCADE
);

CREATE TABLE collaborators(
    collaborator_id CHAR(36),
    company_id CHAR(36) NOT NULL,
    PRIMARY KEY(collaborator_id),
    FOREIGN KEY(collaborator_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY(company_id) REFERENCES companies(company_id)  ON DELETE CASCADE
);

CREATE TABLE subjects(
    subject_id CHAR(36),
    collaborator_id CHAR(36) NOT NULL,
    title CHAR(255) NOT NULL,
    creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category_id CHAR(36) NOT NULL,
    PRIMARY KEY(subject_id),
    UNIQUE(title),
    FOREIGN KEY(category_id) REFERENCES categories(category_id)  ON DELETE CASCADE,
    FOREIGN KEY(collaborator_id) REFERENCES collaborators(collaborator_id)  ON DELETE CASCADE
);

CREATE TABLE calendars(
   contractor_id CHAR(36),
   calendar_id CHAR(36),
   unvailable_begin_date DATETIME NOT NULL,
   unvailable_end_date DATETIME NOT NULL,
   PRIMARY KEY(contractor_id, calendar_id),
   FOREIGN KEY(contractor_id) REFERENCES contractors(contractor_id)
);

CREATE TABLE company_subscriptions(
   company_id CHAR(36),
   company_subscription_id CHAR(36),
   bonus_consultation_number SMALLINT NOT NULL,
   status VARCHAR(50),
   pack_id CHAR(36) NOT NULL,
   PRIMARY KEY(company_id, company_subscription_id),
   FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
   FOREIGN KEY(pack_id) REFERENCES packs(pack_id) ON DELETE CASCADE
);

CREATE TABLE estimates (
   company_id CHAR(36),
   company_subscription_id CHAR(36),
   file VARCHAR(255) NOT NULL,
   creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   signature_date DATETIME,
   employees INT ,
   amount FLOAT NOT NULL DEFAULT 0,
   PRIMARY KEY(company_id, company_subscription_id),
   UNIQUE(file),
   FOREIGN KEY(company_id, company_subscription_id) REFERENCES company_subscriptions(company_id, company_subscription_id) ON DELETE CASCADE
);

CREATE TABLE bills(
    company_id CHAR(36),
    company_subscription_id CHAR(36),
    file VARCHAR(255) NOT NULL,
    payed BOOLEAN NOT NULL DEFAULT FALSE,
    payed_date DATETIME,
    PRIMARY KEY(company_id, company_subscription_id),
    UNIQUE(file),
    FOREIGN KEY(company_id, company_subscription_id) REFERENCES company_subscriptions(company_id, company_subscription_id) ON DELETE CASCADE
);

CREATE TABLE contracts (
   company_id CHAR(36),
   company_subscription_id CHAR(36),
   file VARCHAR(255) NOT NULL,
   creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   signature_date DATETIME,
   company_signed BOOLEAN NOT NULL DEFAULT FALSE,
   admin_signed BOOLEAN NOT NULL DEFAULT FALSE,
   company_signature TEXT,
   admin_signature TEXT,
   PRIMARY KEY(company_id, company_subscription_id),
   UNIQUE(file),
   FOREIGN KEY(company_id, company_subscription_id) REFERENCES company_subscriptions(company_id, company_subscription_id) ON DELETE CASCADE
);

CREATE TABLE posts(
    post_id CHAR(36),
    text TEXT NOT NULL,
    creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    parent_post_id CHAR(36),
    subject_id CHAR(36) NOT NULL,
    collaborator_id CHAR(36) NOT NULL,
    PRIMARY KEY(post_id),
    FOREIGN KEY(parent_post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY(subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    FOREIGN KEY(collaborator_id) REFERENCES collaborators(collaborator_id) ON DELETE CASCADE
);

CREATE TABLE booked_events(
    event_id CHAR(36),
    collaborator_id CHAR(36),
    creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(event_id, collaborator_id),
    FOREIGN KEY(event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY(collaborator_id) REFERENCES collaborators(collaborator_id) ON DELETE CASCADE
);

CREATE TABLE medical_appointments(
    medical_appointment_id CHAR(36),
    contractor_id CHAR(36),
    collaborator_id CHAR(36),
    medical_appointment_date DATETIME NOT NULL,
    creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    bill_file VARCHAR(255) NOT NULL,
    price INT NOT NULL default 50,
    place VARCHAR(8) NOT NULL,
    note SMALLINT,
    PRIMARY KEY(medical_appointment_id),
    UNIQUE(bill_file),
    FOREIGN KEY(contractor_id) REFERENCES contractors(contractor_id) ON DELETE CASCADE,
    FOREIGN KEY(collaborator_id) REFERENCES collaborators(collaborator_id) ON DELETE CASCADE
);


CREATE TABLE rooms(
    room_id VARCHAR(36),
    max_capacity INT NOT NULL,
    PRIMARY KEY(room_id)
);

CREATE TABLE appointments(
    appointment_id CHAR(36),
    contractor_id CHAR(36),
    company_id CHAR(36),
    appointment_date DATETIME NOT NULL,
    creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    bill_file VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    room_id VARCHAR(36),
    note INT,
    PRIMARY KEY(appointment_id),
    UNIQUE(bill_file),
    FOREIGN KEY(contractor_id) REFERENCES contractors(contractor_id) ON DELETE CASCADE,
    FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY(room_id) REFERENCES rooms(room_id) ON DELETE CASCADE
);

CREATE TABLE booked_appointments(
    appointment_id  CHAR(36),
    collaborator_id CHAR(36),
    booked_date     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (appointment_id, collaborator_id),
    FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (collaborator_id) REFERENCES collaborators (collaborator_id) ON DELETE CASCADE
);

CREATE TABLE reports(
    report_id CHAR(36),
    collaborator_id CHAR(36),
    title VARCHAR(255) NOT NULL,
    creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    post_id CHAR(36),
    subject_id CHAR(36),
    medical_appointment_id CHAR(36),
    appointment_id CHAR(36),
    PRIMARY KEY(report_id),
    FOREIGN KEY(collaborator_id) REFERENCES collaborators(collaborator_id) ON DELETE CASCADE,
    FOREIGN KEY(post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY(appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY(medical_appointment_id) REFERENCES medical_appointments(medical_appointment_id) ON DELETE CASCADE,
    FOREIGN KEY(subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
);

CREATE TABLE donations(
   collaborator_id CHAR(36),
   ngo_id CHAR(36),
   bill_file VARCHAR(255) NOT NULL,
   creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   amount INT NOT NULL,
   PRIMARY KEY(collaborator_id, ngo_id),
   UNIQUE(bill_file),
   FOREIGN KEY(collaborator_id) REFERENCES collaborators(collaborator_id) ON DELETE CASCADE,
   FOREIGN KEY(ngo_id) REFERENCES ngo(ngo_id) ON DELETE CASCADE
);

CREATE TABLE chatbot_usages (
    usage_id VARCHAR(255) PRIMARY KEY,
    collaborator_id VARCHAR(255) NOT NULL,
    used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    message_text TEXT,
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(collaborator_id)
);

-- ==================================================
-- 1) TABLE : users
-- ==================================================

INSERT INTO users (
    user_id,
    firstname,
    lastname,
    dob,
    phone,
    email,
    password,
    role,
    country,
    city,
    street,
    pc,
    verified,
    stripe_id
)
VALUES
-- Admin User
('a01973df-c332-4b5b-9973-dfc3327b5b1a',
 'Jean',
 'Dupont',
 '1980-01-01',
 '+33000000001',
 'admin@example.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'ADMIN',
 'France',
 'Paris',
 '1 Rue Principale',
 '75001',
 1,
 NULL
),
-- Collaborator 1
('55555555-5555-5555-5555-555555555555',
 'Marie',
 'Martin',
 '1990-05-10',
 '+33000000002',
 'marie.martin@example.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'Commercial',
 'France',
 'Lyon',
 '2 Rue Secondaire',
 '69000',
 1,
 NULL
),
-- Collaborator 2
('66666666-6666-6666-6666-666666666666',
    'Luc',
    'Dupont',
    '1985-12-01',
    '+33000000003',
    'luc.dupont@example.com',
    'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
    'Agent de secu',
    'France',
    'Marseille',
    '5 Boulevard Sud',
    '13000',
    1,
    NULL
),
-- Collaborator 3
('77777777-7777-7777-7777-777777777777',
    'Sophie',
    'Lemoine',
    '1993-07-22',
    '+33000000004',
    'sophie.lemoine@example.com',
    'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
    'Comptable',
    'France',
    'Toulouse',
    '10 Rue des Lilas',
    '31000',
    1,
    NULL
),
-- Contractor
('33333333-3333-3333-3333-333333333333',
 'Robert',
 'Cotier',
 '1985-09-15',
 '+33000000005',
 'contractor@example.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'CONTRACTOR',
 'France',
 'Nice',
 '12 Allée des Champs',
 '06000',
 1,
 'acct_1RLmMCIBe0viIqjb'
),
-- Company
('44444444-4444-4444-4444-444444444444',
 'Sophie',
 'Entreprise',
 '1987-07-07',
 '+33000000006',
 'company@example.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'RH',
 'France',
 'Toulouse',
 '4 Rue Principale',
 '31000',
 1,
 NULL
),
(
'44444444-5555-5555-5555-444444444441',
    'Serena',
    'Williams',
    '1985-09-15',
    '+33000000007',
    'company2@example.com',
    'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
    'RH',
    'France',
    'Toulouse',
    '8 Rue Principale',
    '31000',
    1,
    NULL
),
(
    '33333333-3333-3333-6721-333333333333',
    'Lea',
    'Saidou',
    '1985-08-12',
    '+33000000017',
    'contractor2@example.com',
    'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
    'Cardiologue',
    'France',
    'Poissy',
    '85 Rue de Paris',
    '78300',
    1,
    'acct_1RLmNeI01qOQpsqd'
),
(
    '33333333-3333-3333-6722-333333333333',
    'Hamza',
    'Sebti',
    '1975-08-29',
    '+33000000027',
    'contractor3@example.com',
    'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
    'Cardiologue',
    'France',
    'Chantelou',
    '5 Rue des platannes',
    '78570',
    1,
    'acct_1RLmQBIMnSyyWvQP'
),
('d3bfa1c7-2e98-4f2c-a0f3-0b5c9b0d91c1', 'Alice', 'Entreprise', '1985-05-05', '+33000000101', 'alice@company.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'COMPANY', 'France', 'Paris', '10 Rue des Lilas', '75001', 1, NULL),

('a7ec2f44-cc2f-4fd5-bd9a-1bb930aa2b2d', 'Bob', 'SAS', '1978-11-12', '+33000010002', 'bob@enterprise.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'COMPANY', 'France', 'Lyon', '15 Avenue République', '69000', 1, NULL),

('3c47e7e5-d124-4b39-90b4-f7c6270f3e79', 'Caroline', 'Entreprise', '1990-03-15', '+33000001003', 'caroline@company.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'COMPANY', 'France', 'Marseille', '7 Impasse Soleil', '13000', 1, NULL),

('90fd4d4e-51fa-4b8e-a21c-8d0f053acac5', 'David', 'SARL', '1982-08-09', '+33000010004', 'david@sarlfr.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'COMPANY', 'France', 'Nice', '3 Place du Marché', '06000', 1, NULL),

('f67cdb98-24e9-42ea-a33c-1b7ed4c32a84', 'Emma', 'Industries', '1995-04-01', '+33000010005', 'emma@industries.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'COMPANY', 'France', 'Bordeaux', '12 Rue des Vignes', '33000', 1, NULL),

('7ee83cb7-7b59-4ea8-8b45-1e63c207f11e', 'Lucas', 'Corp', '1983-12-23', '+33000000107', 'lucas@corpfr.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'COMPANY', 'France', 'Strasbourg', '18 Rue Verte', '67000', 1, NULL),

('e5c97c74-eef5-4b4c-8029-b776c53f5c3c', 'Julie', 'Entreprise', '1992-02-20', '+33010000008', 'julie@entreprise.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'COMPANY', 'France', 'Rennes', '22 Chemin de Bretagne', '35000', 1, NULL),

('6b1e4025-c90e-441b-a3aa-947bcf4f8cf4', 'Antoine', 'Group', '1980-06-06', '+33000010009', 'antoine@group.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'COMPANY', 'France', 'Lille', '1 Allée Centrale', '59000', 1, NULL),

('2d2e2487-35de-4578-9339-2ae41ce2d3dc', 'Nina', 'Startup', '1993-09-17', '+33000001010', 'nina@startup.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a',
 'COMPANY', 'France', 'Grenoble', '5 Rue de l’Innovation', '38000', 1, NULL),

 ('50111111-aaaa-bbbb-cccc-111111111111', 'Alice', 'Entreprise', '1985-05-05', '+3300010001', 'alice@alpha-tech.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Paris', '1 Rue Alpha', '75001', 1, NULL),

('50222222-bbbb-cccc-dddd-222222222222', 'Bob', 'Entreprise', '1980-04-12', '+33000001102', 'bob@beta-corp.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Lyon', '2 Rue Beta', '69000', 1, NULL),

('50333333-cccc-dddd-eeee-333333333333', 'Caroline', 'Entreprise', '1990-03-15', '+33000001103', 'caroline@gamma-group.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Marseille', '3 Rue Gamma', '13000', 1, NULL),

('50444444-dddd-eeee-ffff-444444444444', 'David', 'Entreprise', '1982-08-09', '+33000001104', 'david@delta-industrie.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Nice', '4 Rue Delta', '06000', 1, NULL),

('50555555-eeee-ffff-aaaa-555555555555', 'Emma', 'Entreprise', '1995-04-01', '+33000001105', 'emma@epsilon-services.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Bordeaux', '5 Rue Epsilon', '33000', 1, NULL),

('50666666-ffff-aaaa-bbbb-666666666666', 'Lucas', 'Entreprise', '1983-12-23', '+33000001106', 'lucas@zeta-transports.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Strasbourg', '6 Rue Zeta', '67000', 1, NULL),

('50777777-aaaa-bbbb-cccc-777777777777', 'Julie', 'Entreprise', '1992-02-20', '+33000001107', 'julie@eta-com.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Rennes', '7 Rue Eta', '35000', 1, NULL),

('50888888-bbbb-cccc-dddd-888888888888', 'Antoine', 'Entreprise', '1980-06-06', '+33000001108', 'antoine@theta-fin.com',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Lille', '8 Rue Theta', '59000', 1, NULL),

('50999999-cccc-dddd-eeee-999999999999', 'Nina', 'Entreprise', '1993-09-17', '+33000001109', 'nina@iota-logistique.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Grenoble', '9 Rue Iota', '38000', 1, NULL),

('51000000-dddd-eeee-ffff-000000000000', 'Marc', 'Entreprise', '1987-03-03', '+33000000110', 'marc@kappa-agro.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Angers', '10 Rue Kappa', '49000', 1, NULL),

-- Users with company size 100–200
('51111111-aaaa-bbbb-cccc-111111111122', 'Isabelle', 'Entreprise', '1984-02-10', '+33000000111', 'isabelle@lambda-eco.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Tours', '11 Rue Lambda', '37000', 1, NULL),

('51222222-bbbb-cccc-dddd-222222222233', 'Clara', 'Entreprise', '1990-01-01', '+33000000112', 'clara@mu-medical.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Nantes', '12 Rue Mu', '44000', 1, NULL),

('51333333-cccc-dddd-eeee-333333333344', 'Paul', 'Entreprise', '1988-11-11', '+33000000113', 'paul@nu-commerce.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Dijon', '13 Rue Nu', '21000', 1, NULL),

('51444444-dddd-eeee-ffff-444444444455', 'Hugo', 'Entreprise', '1991-09-09', '+33000000114', 'hugo@xi-dev.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Besançon', '14 Rue Xi', '25000', 1, NULL),

('51555555-eeee-ffff-aaaa-555555555566', 'Léa', 'Entreprise', '1986-06-06', '+33000000115', 'lea@omicronlabs.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Orléans', '15 Rue Omicron', '45000', 1, NULL),

-- Users with company size 10–30
('51666666-ffff-aaaa-bbbb-666666666677', 'Chloé', 'Entreprise', '1994-12-12', '+33000000116', 'chloe@pi-start.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Metz', '16 Rue Pi', '57000', 1, NULL),

('51777777-aaaa-bbbb-cccc-777777777788', 'Romain', 'Entreprise', '1981-05-01', '+33000000117', 'romain@rho-dev.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Reims', '17 Rue Rho', '51100', 1, NULL),

('51888888-bbbb-cccc-dddd-888888888899', 'Lucie', 'Entreprise', '1996-03-03', '+33000000118', 'lucie@sigma-test.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Perpignan', '18 Rue Sigma', '66000', 1, NULL),

('51999999-cccc-dddd-eeee-999999999900', 'Bastien', 'Entreprise', '1997-10-10', '+33000000119', 'bastien@tau-design.fr',
 'df6b9fb15cfdbb7527be5a8a6e39f39e572c8ddb943fbc79a943438e9d3d85ebfc2ccf9e0eccd9346026c0b6876e0e01556fe56f135582c05fbdbb505d46755a', 'COMPANY', 'France', 'Le Havre', '19 Rue Tau', '76600', 1, NULL);



-- ==================================================
-- 2) TABLE : administrators
-- ==================================================
INSERT INTO administrators (admin_id)
VALUES
    ('a01973df-c332-4b5b-9973-dfc3327b5b1a');



INSERT INTO companies (
    company_id,
    name,
    registration_number,
    registration_date,
    industry,
    revenue,
    size,
    admin_id
)
VALUES
('44444444-5555-5555-5555-444444444441', 'Société Test', 'REG-123456', '2021-01-01', 'Technologie', 500000, 100, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('d3bfa1c7-2e98-4f2c-a0f3-0b5c9b0d91c1', 'Alice Conseil', 'REG-000001', '2018-06-15', 'Conseil', 120000, 12, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('a7ec2f44-cc2f-4fd5-bd9a-1bb930aa2b2d', 'Bob Entreprise', 'REG-000002', '2019-02-01', 'Informatique', 450000, 45, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('3c47e7e5-d124-4b39-90b4-f7c6270f3e79', 'Caroline Group', 'REG-000003', '2020-09-30', 'Immobilier', 380000, 30, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('90fd4d4e-51fa-4b8e-a21c-8d0f053acac5', 'David SARL', 'REG-000004', '2022-01-12', 'BTP', 800000, 80, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('f67cdb98-24e9-42ea-a33c-1b7ed4c32a84', 'Emma Industries', 'REG-000005', '2017-11-07', 'Manufacture', 250000, 25, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('44444444-4444-4444-4444-444444444444', 'Entreprise Exemple', 'REG-000006', '2020-05-20', 'Services', 300000, 29, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('7ee83cb7-7b59-4ea8-8b45-1e63c207f11e', 'Lucas Corp', 'REG-000007', '2021-03-25', 'Transport', 600000, 60, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('e5c97c74-eef5-4b4c-8029-b776c53f5c3c', 'Julie SAS', 'REG-000008', '2016-07-13', 'Restauration', 200000, 18, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('6b1e4025-c90e-441b-a3aa-947bcf4f8cf4', 'Antoine Global', 'REG-000009', '2019-12-05', 'Énergie', 920000, 90, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('2d2e2487-35de-4578-9339-2ae41ce2d3dc', 'Nina Startup', 'REG-000010', '2023-02-20', 'Technologie', 150000, 10, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('50111111-aaaa-bbbb-cccc-111111111111', 'Alpha Tech', 'REG-100001', '2018-01-10', 'Technologie', 1200000, 300, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('50222222-bbbb-cccc-dddd-222222222222', 'Beta Corp', 'REG-100002', '2019-03-15', 'Finance', 1800000, 450, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('50333333-cccc-dddd-eeee-333333333333', 'Gamma Group', 'REG-100003', '2020-06-20', 'Santé', 950000, 260, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('50444444-dddd-eeee-ffff-444444444444', 'Delta Industrie', 'REG-100004', '2021-02-05', 'Manufacture', 2200000, 600, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('50555555-eeee-ffff-aaaa-555555555555', 'Epsilon Services', 'REG-100005', '2022-07-18', 'Services', 1350000, 510, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('50666666-ffff-aaaa-bbbb-666666666666', 'Zeta Transports', 'REG-100006', '2017-04-12', 'Transport', 1950000, 700, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('50777777-aaaa-bbbb-cccc-777777777777', 'Eta Com', 'REG-100007', '2016-09-30', 'Communication', 1100000, 330, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('50888888-bbbb-cccc-dddd-888888888888', 'Theta Fin', 'REG-100008', '2020-11-25', 'Finance', 1600000, 990, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('50999999-cccc-dddd-eeee-999999999999', 'Iota Logistique', 'REG-100009', '2019-05-19', 'Logistique', 890000, 270, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('51000000-dddd-eeee-ffff-000000000000', 'Kappa Agro', 'REG-100010', '2023-01-01', 'Agroalimentaire', 1550000, 410, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),


('51111111-aaaa-bbbb-cccc-111111111122', 'Lambda Eco', 'REG-100011', '2020-03-10', 'Écologie', 420000, 120, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('51222222-bbbb-cccc-dddd-222222222233', 'Mu Médical', 'REG-100012', '2019-09-08', 'Santé', 510000, 180, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('51333333-cccc-dddd-eeee-333333333344', 'Nu Commerce', 'REG-100013', '2021-07-04', 'Commerce', 390000, 150, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('51444444-dddd-eeee-ffff-444444444455', 'Xi Développement', 'REG-100014', '2022-08-29', 'Technologie', 470000, 130, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('51555555-eeee-ffff-aaaa-555555555566', 'Omicron Labs', 'REG-100015', '2018-10-17', 'Recherche', 610000, 190, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),


('51666666-ffff-aaaa-bbbb-666666666677', 'Pi Start', 'REG-100016', '2023-02-11', 'Technologie', 90000, 28, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('51777777-aaaa-bbbb-cccc-777777777788', 'Rho Dev', 'REG-100017', '2021-05-20', 'Développement', 75000, 15, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('51888888-bbbb-cccc-dddd-888888888899', 'Sigma Test', 'REG-100018', '2020-12-03', 'QA', 82000, 10, 'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
('51999999-cccc-dddd-eeee-999999999900', 'Tau Design', 'REG-100019', '2022-06-14', 'Design', 67000, 22, 'a01973df-c332-4b5b-9973-dfc3327b5b1a');


INSERT INTO collaborators (
    collaborator_id,
    company_id
)
VALUES
    -- Collaborator 1 → Marie Martin
    ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444'),

    -- Collaborator 2 → Luc Dupont
    ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444'),

    -- Collaborator 3 → Sophie Lemoine
    ('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444');
-- ==================================================
-- 3) TABLE : categories
-- ==================================================
INSERT INTO categories (category_id, title)
VALUES
  ('55555555-5555-5555-5555-000000000001', 'Sante physique et prevention'),
('55555555-5555-5555-5555-000000000002', 'Bien-etre mental et stress'),
('55555555-5555-5555-5555-000000000003', 'Activites sportives et challenges'),
('55555555-5555-5555-5555-000000000004', 'Nutrition et alimentation saine'),
('55555555-5555-5555-5555-000000000005', 'Equilibre vie pro / perso'),
('55555555-5555-5555-5555-000000000006', 'Initiatives bien-etre en entreprise');



INSERT INTO subjects (subject_id, collaborator_id, title, category_id)
VALUES
-- Catégorie 1 : Santé physique et prévention
('11111111-1111-1111-1111-000000000001', '55555555-5555-5555-5555-555555555555', 'Prevention des TMS', '55555555-5555-5555-5555-000000000001'),
('11111111-1111-1111-1111-000000000002', '55555555-5555-5555-5555-555555555555', 'Seances d’etirement en entreprise', '55555555-5555-5555-5555-000000000001'),

-- Catégorie 2 : Bien-être mental et stress
('11111111-1111-1111-1111-000000000003', '55555555-5555-5555-5555-555555555555', 'Gerer le stress au travail', '55555555-5555-5555-5555-000000000002'),
('11111111-1111-1111-1111-000000000004', '55555555-5555-5555-5555-555555555555', 'Meditation et pleine conscience', '55555555-5555-5555-5555-000000000002'),

-- Catégorie 3 : Activités sportives et challenges
('11111111-1111-1111-1111-000000000005', '55555555-5555-5555-5555-555555555555', 'Defi 10 000 pas par jour', '55555555-5555-5555-5555-000000000003'),
('11111111-1111-1111-1111-000000000006', '55555555-5555-5555-5555-555555555555', 'Tournoi de ping-pong', '55555555-5555-5555-5555-000000000003'),

-- Catégorie 4 : Nutrition et alimentation saine
('11111111-1111-1111-1111-000000000007', '55555555-5555-5555-5555-555555555555', 'Ateliers de cuisine saine', '55555555-5555-5555-5555-000000000004'),
('11111111-1111-1111-1111-000000000008', '55555555-5555-5555-5555-555555555555', 'Menus equilibres à la cafeteria', '55555555-5555-5555-5555-000000000004'),

-- Catégorie 5 : Équilibre vie pro/perso
('11111111-1111-1111-1111-000000000009', '55555555-5555-5555-5555-555555555555', 'Teletravail et organisation', '55555555-5555-5555-5555-000000000005'),
('11111111-1111-1111-1111-000000000010', '55555555-5555-5555-5555-555555555555', 'Gestion du temps et priorites', '55555555-5555-5555-5555-000000000005'),

-- Catégorie 6 : Initiatives bien-être en entreprise
('11111111-1111-1111-1111-000000000011', '55555555-5555-5555-5555-555555555555', 'Ambassadeurs bien-etre', '55555555-5555-5555-5555-000000000006'),
('11111111-1111-1111-1111-000000000012', '55555555-5555-5555-5555-555555555555', 'Espace detente au bureau', '55555555-5555-5555-5555-000000000006');

-- ==================================================
-- 4) TABLE : ngo
-- ==================================================
INSERT INTO ngo (
    ngo_id,
    name,
    registration_number,
    registration_date,
    address,
    country,
    type,
    presentation,
    website,
    phone
)
VALUES
    ('66666666-6666-6666-6666-666666666666',
     'ONG Exemple',
     'REG-123456',
     '2021-01-01',
     '1 Rue Humanitaire, Paris',
     'France',
     'Humanitaire',
     'Présentation de l’ONG...',
     'https://ong-exemple.fr',
     '+33000000005');

-- ==================================================
-- 5) TABLE : 
-- ==================================================
INSERT INTO packs (
    pack_id,
    name,
    activity_number,
    annual_collaborator_price,
    bonus_consultation_price,
    default_consultation_number,
    staff_size,
    chatbot_messages_number

)
VALUES
    (
     '77777777-7777-7777-7777-777777777777',
     'Starter',
     2,
     180,
     75,
     1,
     30,
     6
    ),
    ('88888888-8888-8888-8888-888888888888',
     'Basic',
     3,
     150,
     75,
     2,
     250,
     20
    ),
    (
     '99999999-9999-9999-9999-999999999999',
     'Premium',
     4,
     100,
     50,
     3,
     10000,
     500
    );


-- ==================================================
-- 6) TABLE : tickets
-- ==================================================
INSERT INTO tickets (
    ticket_id,
    title,
    text,
    user_id,
    admin_id
)
VALUES
    ('88888888-8888-8888-8888-888888888888',
     'Ticket 1',
     'Mon problème est le suivant...',
     '77777777-7777-7777-7777-777777777777',
     'a01973df-c332-4b5b-9973-dfc3327b5b1a');

-- ==================================================
-- 7) TABLE : messages
-- ==================================================
INSERT INTO messages (
    ticket_id,
    messages_id,
    text,
    user_id
)
VALUES
    ('88888888-8888-8888-8888-888888888888',
     '99999999-9999-9999-9999-999999999999',
     'Pouvez-vous préciser ?',
     '77777777-7777-7777-7777-777777777777');

-- ==================================================
-- 8) TABLE : companies
-- ==================================================


INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '44444444-5555-5555-5555-444444444441', '20132017-ba3e-433f-8566-22777e0de0d2', 10, 'ACTIVE', '88888888-8888-8888-8888-888888888888'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '44444444-5555-5555-5555-444444444441', '20132017-ba3e-433f-8566-22777e0de0d2',
    'devis_Société_Test_20132017-ba3e-433f-8566-22777e0de0d2_2025-05-02.pdf',
    '2025-05-02 09:00:00', '2025-05-02 09:01:00', 100, 15750
);


INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    'd3bfa1c7-2e98-4f2c-a0f3-0b5c9b0d91c1', 'e06b1ff7-17d6-4081-8dcc-e199fd4c841b', 10, 'ACTIVE', '77777777-7777-7777-7777-777777777777'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    'd3bfa1c7-2e98-4f2c-a0f3-0b5c9b0d91c1', 'e06b1ff7-17d6-4081-8dcc-e199fd4c841b',
    'devis_Alice_Conseil_e06b1ff7-17d6-4081-8dcc-e199fd4c841b_2025-05-01.pdf',
    '2025-05-01 09:00:00', '2025-05-01 09:03:00', 12, 2268
);


INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    'a7ec2f44-cc2f-4fd5-bd9a-1bb930aa2b2d', '2292229b-bd23-455b-935b-83aa80b71899', 10, 'ACTIVE', '88888888-8888-8888-8888-888888888888'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    'a7ec2f44-cc2f-4fd5-bd9a-1bb930aa2b2d', '2292229b-bd23-455b-935b-83aa80b71899',
    'devis_Bob_Entreprise_2292229b-bd23-455b-935b-83aa80b71899_2025-05-03.pdf',
    '2025-05-03 07:00:00', '2025-05-03 09:00:00', 45, 7087.5
);


INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '3c47e7e5-d124-4b39-90b4-f7c6270f3e79', '05249cf8-8cc8-417a-b61f-5072c9278905', 10, 'EXPIREE', '77777777-7777-7777-7777-777777777777'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '3c47e7e5-d124-4b39-90b4-f7c6270f3e79', '05249cf8-8cc8-417a-b61f-5072c9278905',
    'devis_Caroline_Group_05249cf8-8cc8-417a-b61f-5072c9278905_2024-05-03.pdf',
    '2024-05-03 09:00:00', '2024-05-03 09:10:00', 30, 5670
);


INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '90fd4d4e-51fa-4b8e-a21c-8d0f053acac5', '8e0df83a-d157-4fa8-98b0-3bc18520227f', 10, 'ACTIVE', '88888888-8888-8888-8888-888888888888'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '90fd4d4e-51fa-4b8e-a21c-8d0f053acac5', '8e0df83a-d157-4fa8-98b0-3bc18520227f',
    'devis_David_SARL_8e0df83a-d157-4fa8-98b0-3bc18520227f_2025-01-01.pdf',
    '2025-01-01 09:00:00', '2025-01-01 11:00:00', 80, 12600
);


INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    'f67cdb98-24e9-42ea-a33c-1b7ed4c32a84', '3d06ca28-c3c3-41ea-984a-53f5706320d9', 10, 'EXPIREE', '77777777-7777-7777-7777-777777777777'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    'f67cdb98-24e9-42ea-a33c-1b7ed4c32a84', '3d06ca28-c3c3-41ea-984a-53f5706320d9',
    'devis_Emma_Industries_3d06ca28-c3c3-41ea-984a-53f5706320d9_2023-10-01.pdf',
    '2023-10-01 09:00:00', '2023-10-01 09:30:00', 25, 3937.5
);




INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '7ee83cb7-7b59-4ea8-8b45-1e63c207f11e', '3115ffcd-8fcb-42e3-a1c7-9c7ad22e6296', 10, 'ACTIVE', '88888888-8888-8888-8888-888888888888'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '7ee83cb7-7b59-4ea8-8b45-1e63c207f11e', '3115ffcd-8fcb-42e3-a1c7-9c7ad22e6296',
    'devis_Lucas_Corp_3115ffcd-8fcb-42e3-a1c7-9c7ad22e6296_2025-01-13.pdf',
    '2025-01-13 15:00:00', '2025-01-13 15:00:40', 60, 9450
);


INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    'e5c97c74-eef5-4b4c-8029-b776c53f5c3c', 'd8553094-f588-4e6c-a485-625e6aaa9a29', 10, 'ACTIVE', '77777777-7777-7777-7777-777777777777'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    'e5c97c74-eef5-4b4c-8029-b776c53f5c3c', 'd8553094-f588-4e6c-a485-625e6aaa9a29',
    'devis_Julie_SAS_d8553094-f588-4e6c-a485-625e6aaa9a29_2025-04-01.pdf',
    '2025-04-01 09:30:00', '2025-04-01 09:35:00', 18, 3402
);


INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '6b1e4025-c90e-441b-a3aa-947bcf4f8cf4', '6ceb5f3e-127a-4593-b7ab-8eea8ebf0740', 10, 'ACTIVE', '88888888-8888-8888-8888-888888888888'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '6b1e4025-c90e-441b-a3aa-947bcf4f8cf4', '6ceb5f3e-127a-4593-b7ab-8eea8ebf0740',
    'devis_Antoine_Global_6ceb5f3e-127a-4593-b7ab-8eea8ebf0740_2025-04-01.pdf',
    '2025-04-01 09:10:00', '2025-04-01 09:20:00', 90, 14175
);


INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '2d2e2487-35de-4578-9339-2ae41ce2d3dc', '8e6643c8-c3be-4f3e-a0c3-2746336d0b9a', 10, 'ACTIVE', '77777777-7777-7777-7777-777777777777'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '2d2e2487-35de-4578-9339-2ae41ce2d3dc', '8e6643c8-c3be-4f3e-a0c3-2746336d0b9a',
    'devis_Nina_Startup_8e6643c8-c3be-4f3e-a0c3-2746336d0b9a_2025-02-01.pdf',
    '2025-02-01 08:00:00', '2025-02-01 08:10:00', 10, 1890
);

-- 1
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '50111111-aaaa-bbbb-cccc-111111111111', '82297047-4e22-45e6-8abc-1110b43ef096', 10, 'ACTIVE', '99999999-9999-9999-9999-999999999999'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '50111111-aaaa-bbbb-cccc-111111111111', '82297047-4e22-45e6-8abc-1110b43ef096', 'devis_Alpha_Tech_82297047-4e22-45e6-8abc-1110b43ef096_2025-03-15.pdf',
    '2025-03-15 09:30:00', '2025-03-15 10:00:00', 300, 31500
);

-- 2
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '50222222-bbbb-cccc-dddd-222222222222', 'da2b351a-c310-4b92-85bf-1542dd27dab1', 10, 'ACTIVE', '99999999-9999-9999-9999-999999999999'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '50222222-bbbb-cccc-dddd-222222222222', 'da2b351a-c310-4b92-85bf-1542dd27dab1', 'devis_Beta_Corp_da2b351a-c310-4b92-85bf-1542dd27dab1_2025-01-01.pdf',
    '2025-01-01 07:30:00', '2025-01-01 09:00:00', 450, 47250
);

-- 3
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '50333333-cccc-dddd-eeee-333333333333', 'addf76d4-931e-4822-be91-cf93fb090781', 10, 'ACTIVE', '99999999-9999-9999-9999-999999999999'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '50333333-cccc-dddd-eeee-333333333333', 'addf76d4-931e-4822-be91-cf93fb090781', 'devis_Gamma_Group_addf76d4-931e-4822-be91-cf93fb090781_2025-01-09.pdf',
    '2025-01-09 05:00:00', '2025-01-09 05:03:00', 260, 40950
);

-- 4
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '50444444-dddd-eeee-ffff-444444444444', 'e7f7e958-f5f0-47d1-b351-a95b9a7cdbb8', 10, 'ACTIVE', '99999999-9999-9999-9999-999999999999'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '50444444-dddd-eeee-ffff-444444444444', 'e7f7e958-f5f0-47d1-b351-a95b9a7cdbb8', 'devis_Delta_Industrie_e7f7e958-f5f0-47d1-b351-a95b9a7cdbb8_2025-04-14.pdf',
    '2025-04-14 14:30:00', '2025-04-14 14:31:00', 600, 63000
);

-- 5
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '50555555-eeee-ffff-aaaa-555555555555', '4b1f6a98-fc9e-40ef-b876-9863885d5c89', 10, 'ACTIVE', '99999999-9999-9999-9999-999999999999'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '50555555-eeee-ffff-aaaa-555555555555', '4b1f6a98-fc9e-40ef-b876-9863885d5c89', 'devis_Epsilon_Services_4b1f6a98-fc9e-40ef-b876-9863885d5c89_2025-02-15.pdf',
    '2025-02-15 07:10:00',  '2025-02-15 07:10:50', 510, 53550
);

-- 6
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '50666666-ffff-aaaa-bbbb-666666666666', '7df0f574-ba2b-46fe-9f67-6d39fbac6022', 10, 'ACTIVE', '99999999-9999-9999-9999-999999999999'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '50666666-ffff-aaaa-bbbb-666666666666', '7df0f574-ba2b-46fe-9f67-6d39fbac6022', 'devis_Zeta_Transports_7df0f574-ba2b-46fe-9f67-6d39fbac6022_2025-01-01.pdf',
    '2025-01-01 16:00:00', '2025-01-01 16:10:00', 700, 73500
);

-- 7
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '50777777-aaaa-bbbb-cccc-777777777777', '1ee3e95c-4646-4c08-ab9e-42252978761c', 10, 'ACTIVE', '99999999-9999-9999-9999-999999999999'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '50777777-aaaa-bbbb-cccc-777777777777', '1ee3e95c-4646-4c08-ab9e-42252978761c', 'devis_Eta_Com_1ee3e95c-4646-4c08-ab9e-42252978761c_2025-03-01.pdf',
    '2025-03-01 09:10:00', '2025-03-01 09:12:00', 330, 34650
);

-- 8
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '50888888-bbbb-cccc-dddd-888888888888', '5ac9fe80-c603-4a26-9d98-5ef7c73388d7', 10, 'EXPIREE', '99999999-9999-9999-9999-999999999999'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '50888888-bbbb-cccc-dddd-888888888888', '5ac9fe80-c603-4a26-9d98-5ef7c73388d7', 'devis_Theta_Fin_5ac9fe80-c603-4a26-9d98-5ef7c73388d7_2024-10-01.pdf',
    '2024-10-01 09:00:00', '2024-10-01 09:10:00', 990, 103950
);

-- 9
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '50999999-cccc-dddd-eeee-999999999999', '54b2fc13-6fa3-4abf-8557-0d7a87ccd0ed', 10, 'EXPIREE', '99999999-9999-9999-9999-999999999999'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '50999999-cccc-dddd-eeee-999999999999', '54b2fc13-6fa3-4abf-8557-0d7a87ccd0ed', 'devis_Iota_Logistique_54b2fc13-6fa3-4abf-8557-0d7a87ccd0ed_2023-10-01.pdf',
    '2023-10-01 09:00:00', '2023-10-01 09:10:00', 270, 28350
);

-- 10
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '51000000-dddd-eeee-ffff-000000000000', 'dbf3882d-d4d1-4fd6-bc69-5904e8d27cee', 10, 'EXPIREE', '99999999-9999-9999-9999-999999999999'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '51000000-dddd-eeee-ffff-000000000000', 'dbf3882d-d4d1-4fd6-bc69-5904e8d27cee', 'devis_Kappa_Agro_dbf3882d-d4d1-4fd6-bc69-5904e8d27cee_2023-10-01.pdf',
    '2023-10-01 09:00:00', '2023-10-01 09:00:00', 410, 43050
);


-- 11
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '51111111-aaaa-bbbb-cccc-111111111122', '94da51c8-6115-4a19-a09d-a6e0d4e4554d', 10, 'EXPIREE', '88888888-8888-8888-8888-888888888888'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '51111111-aaaa-bbbb-cccc-111111111122', '94da51c8-6115-4a19-a09d-a6e0d4e4554d', 'devis_Lambda_Eco_94da51c8-6115-4a19-a09d-a6e0d4e4554d_2024-01-01.pdf',
    '2024-01-01 09:00:00', '2024-01-01 09:10:00', 120, 18900
);

-- 12
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '51222222-bbbb-cccc-dddd-222222222233', '48d29d02-fc86-419e-a2aa-5e6f338ea2c0', 10, 'ACTIVE', '88888888-8888-8888-8888-888888888888'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '51222222-bbbb-cccc-dddd-222222222233', '48d29d02-fc86-419e-a2aa-5e6f338ea2c0', 'devis_Mu_Medical_48d29d02-fc86-419e-a2aa-5e6f338ea2c0_2025-04-01.pdf',
    '2025-04-01 10:00:00', '2025-04-01 10:10:00', 180, 28350
);

-- 13
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '51333333-cccc-dddd-eeee-333333333344', 'a30e56b2-084e-42bb-9d1c-71d369bbd83d', 10, 'ACTIVE', '88888888-8888-8888-8888-888888888888'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '51333333-cccc-dddd-eeee-333333333344', 'a30e56b2-084e-42bb-9d1c-71d369bbd83d', 'devis_Nu_Commerce_a30e56b2-084e-42bb-9d1c-71d369bbd83d_2025-02-01.pdf',
    '2025-02-01 09:40:00','2025-02-01 09:45:00', 150, 23625
);

-- 14
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '51444444-dddd-eeee-ffff-444444444455', 'f671f57f-937c-4b92-bf82-b72d09d5793f', 10, 'ACTIVE', '88888888-8888-8888-8888-888888888888'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '51444444-dddd-eeee-ffff-444444444455', 'f671f57f-937c-4b92-bf82-b72d09d5793f', 'devis_Xi_Developpement_f671f57f-937c-4b92-bf82-b72d09d5793f_2025-01-01.pdf',
    '2025-01-01 09:50:00', '2025-01-01 09:55:00', 130, 20475
);

-- 15
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '51555555-eeee-ffff-aaaa-555555555566', '841d7397-c47f-4dc2-a38d-1a2f5b7db65b', 10, 'ACTIVE', '88888888-8888-8888-8888-888888888888'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '51555555-eeee-ffff-aaaa-555555555566', '841d7397-c47f-4dc2-a38d-1a2f5b7db65b', 'devis_Omicron_Labs_841d7397-c47f-4dc2-a38d-1a2f5b7db65b_2025-02-01.pdf',
    '2025-02-01 14:00:00', '2025-02-01 14:20:00', 190, 29925
);

-- 16
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '51666666-ffff-aaaa-bbbb-666666666677', '48644ea9-0cf6-4e82-a69e-c3a74ddf5b77', 10, 'ACTIVE', '77777777-7777-7777-7777-777777777777'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '51666666-ffff-aaaa-bbbb-666666666677', '48644ea9-0cf6-4e82-a69e-c3a74ddf5b77', 'devis_Pi_Start_48644ea9-0cf6-4e82-a69e-c3a74ddf5b77_2025-01-11.pdf',
    '2025-01-11 15:00:00', '2025-01-11 15:10:00', 28, 5292
);

-- 17
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '51777777-aaaa-bbbb-cccc-777777777788', '765e7f61-7b4b-4f96-bc09-e14e10c98fd8', 10, 'ACTIVE', '77777777-7777-7777-7777-777777777777'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '51777777-aaaa-bbbb-cccc-777777777788', '765e7f61-7b4b-4f96-bc09-e14e10c98fd8', 'devis_Rho_Dev_765e7f61-7b4b-4f96-bc09-e14e10c98fd8_2025-01-01.pdf',
    '2025-01-01 09:30:00', '2025-01-01 09:32:00', 15, 2835
);

-- 18
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '51888888-bbbb-cccc-dddd-888888888899', '6a2a3d77-6d91-49a5-b3a5-bc85942b3062', 10, 'EXPIREE', '77777777-7777-7777-7777-777777777777'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '51888888-bbbb-cccc-dddd-888888888899', '6a2a3d77-6d91-49a5-b3a5-bc85942b3062', 'devis_Sigma_Test_6a2a3d77-6d91-49a5-b3a5-bc85942b3062_2023-11-01.pdf',
    '2023-11-01 09:00:00', '2023-11-01 09:20:00', 10, 1890
);

-- 19
INSERT INTO company_subscriptions (
    company_id, company_subscription_id, bonus_consultation_number, status, pack_id
) VALUES (
    '51999999-cccc-dddd-eeee-999999999900', 'c396c12f-2db3-4b9a-8f57-23d3b42fe011', 10, 'EXPIREE', '77777777-7777-7777-7777-777777777777'
);

INSERT INTO estimates (
    company_id, company_subscription_id, file, creation_date, signature_date, employees, amount
) VALUES (
    '51999999-cccc-dddd-eeee-999999999900', 'c396c12f-2db3-4b9a-8f57-23d3b42fe011', 'devis_Tau_Design_c396c12f-2db3-4b9a-8f57-23d3b42fe011_2024-01-01.pdf',
    '2024-01-01 09:00:00', '2024-01-01 09:10:00', 22, 4158
);


-- ==================================================
-- 9) TABLE : contractors
-- ==================================================
INSERT INTO contractors (
    contractor_id,
    registration_number,
    registration_date,
    service,
    website,
    sign_date,
    contract_file, 
    service_price,
    intervention,
    type,
    admin_id
)
VALUES
    ('33333333-3333-3333-3333-333333333333',
     'REG-456789',
     '2022-03-15',
     'Cardiologue',
     'https://cardio-expert.com',
     '2022-03-20',
     'contract_cardio_456789.pdf',
     1000,
     'both',
     'Medical',
     'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
    ('33333333-3333-3333-6721-333333333333',
     'REG-123456',
     '2021-01-01',
     'Psychiatre',
     'https://psycare.fr',
     '2021-01-10',
     'contract_psy_123456.pdf',
     45,
     'outcall',
     'Medical',
     'a01973df-c332-4b5b-9973-dfc3327b5b1a'),
    ('33333333-3333-3333-6722-333333333333',
     'REG-123458',
     '2021-01-01',
     'Yoga',
     'https://yoga-bienetre.com',
     '2021-01-12',
     'contract_yoga_123458.pdf',
     85,
     'incall',
     'Healthy',
     'a01973df-c332-4b5b-9973-dfc3327b5b1a');

-- ==================================================
-- 10) TABLE : events
-- ==================================================
INSERT INTO events (
    event_id,
    created_at,
    begin_at,
    end_at,
    place,
    title,
    capacity,
    ngo_id
)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     '2023-01-01 10:00:00',
     '2023-01-05 09:00:00',
     '2023-01-05 18:00:00',
     'Salle de conférence, Paris',
     'Conférence bénévole',
     100,
     '66666666-6666-6666-6666-666666666666');

INSERT INTO events (
    event_id,
    created_at,
    begin_at,
    end_at,
    place,
    title,
    capacity,
    ngo_id
)
VALUES (
    '99999999-9999-9999-9999-999999999999', -- ID unique de l’événement
    NOW(),                                 -- Date de création = maintenant
    '2025-06-10 10:00:00',                 -- Date de début = à venir
    '2025-06-10 12:00:00',                 -- Date de fin
    'Salle municipale, Lyon',
    'Atelier de solidarité',
    50,                                    -- Capacité max
    '66666666-6666-6666-6666-666666666666' -- Lien avec l'association
);



-- ==================================================
-- 12) TABLE : subjects
-- ==================================================

-- ==================================================
-- 13) TABLE : calendar
-- ==================================================
INSERT INTO calendars (
    contractor_id,
    calendar_id,
    unvailable_begin_date,
    unvailable_end_date
)
VALUES
    ('33333333-3333-3333-3333-333333333333',
     'cccccccc-cccc-cccc-cccc-cccccccccccc',
     '2023-11-01 08:00:00',
     '2023-11-01 17:00:00');



INSERT INTO booked_events (
    event_id,
    collaborator_id,
    creation_date
)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     '77777777-7777-7777-7777-777777777777',
     '2023-11-07 09:00:00');


INSERT INTO rooms (
    room_id,
    max_capacity
) VALUES (
    '5',
    10
);

-- ==================================================
-- 20) TABLE : appointments
-- ==================================================
INSERT INTO appointments (
    appointment_id,
    contractor_id,
    company_id,
    appointment_date,
    creation_date,
    status,
    bill_file,
    capacity,
    room_id
)
VALUES
    ('99999999-9999-9999-9999-999999999999',
     '33333333-3333-3333-3333-333333333333',
     '44444444-4444-4444-4444-444444444444',
     '2023-12-01 15:00:00',
     '2023-11-30 12:00:00',
     'CONFIRMED',
     'facture_consultation.pdf',
     5,
     '5');


INSERT INTO medical_appointments(
    medical_appointment_id,
    contractor_id,
    collaborator_id,
    medical_appointment_date,
    creation_date,
    status,
    bill_file,
    place
) VALUES (
    '99999999-9999-9999-9999-999999999999',
    '33333333-3333-3333-3333-333333333333',
    '77777777-7777-7777-7777-777777777777',
    '2023-12-01 15:00:00',
    '2023-11-30 12:00:00',
    'PAYED',
    'facture_consultation.pdf',
    'Incall'
    );

-- ==================================================
-- 21) TABLE : reports

-- ==================================================
-- 22) TABLE : donations
-- ==================================================


-- =============================================================================
-- FIN DU SCRIPT
-- =============================================================================
