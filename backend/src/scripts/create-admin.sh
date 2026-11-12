#!/bin/bash
read -r -p "Username admin: " ADMIN_USERNAME
read -r -s -p "Password admin: " ADMIN_PASSWORD
echo

export ADMIN_USERNAME ADMIN_PASSWORD

node src/scripts/create-admin.js

unset ADMIN_USERNAME ADMIN_PASSWORD