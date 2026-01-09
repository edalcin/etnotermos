#!/bin/bash
# MongoDB initialization script for EtnoTermos
# Creates database "etnodb" and collection "etnotermos"

echo "Initializing MongoDB for EtnoTermos..."

# Connect to MongoDB and create database and collection
mongosh <<EOF
use etnodb

// Create etnotermos collection
db.createCollection("etnotermos")

// Create etnotermos-sources collection
db.createCollection("etnotermos-sources")

// Create etnotermos-collections collection
db.createCollection("etnotermos-collections")

// Create etnotermos-notes collection
db.createCollection("etnotermos-notes")

// Create etnotermos-relationships collection
db.createCollection("etnotermos-relationships")

// Create etnotermos-audit-logs collection
db.createCollection("etnotermos-audit-logs")

print("EtnoTermos collections created successfully")
EOF

echo "MongoDB initialization complete"
