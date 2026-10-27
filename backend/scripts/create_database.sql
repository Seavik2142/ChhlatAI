-- Creates the app role and databases on your local PostgreSQL.
-- Run once:  /Library/PostgreSQL/18/bin/psql -U postgres -f backend/scripts/create_database.sql
-- Change the password here and in backend/.env for anything beyond local development.
CREATE ROLE chhlat LOGIN PASSWORD 'chhlat';
CREATE DATABASE chhlatai OWNER chhlat ENCODING 'UTF8';
CREATE DATABASE chhlatai_test OWNER chhlat ENCODING 'UTF8';
